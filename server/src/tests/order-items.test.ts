import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { orderItemsTable, ordersTable, productsTable, usersTable, categoriesTable } from '../db/schema';
import { type CreateOrderItemInput, type UpdateOrderItemInput, type DeleteInput, type GetByIdInput } from '../schema';
import { 
  createOrderItem, 
  getOrderItems, 
  getOrderItemById, 
  getOrderItemsByOrderId, 
  updateOrderItem, 
  deleteOrderItem 
} from '../handlers/order-items';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  is_active: true
};

const testCategory = {
  name: 'Test Category',
  description: 'A category for testing',
  is_active: true
};

const testProduct = {
  name: 'Test Product',
  description: 'A product for testing',
  price: '29.99', // Store as string for database
  stock_quantity: 100,
  is_active: true
};

const testOrder = {
  status: 'pending' as const,
  total_amount: '59.98', // Store as string for database
  notes: 'Test order'
};

const testOrderItemInput: CreateOrderItemInput = {
  order_id: 1, // Will be set after creating order
  product_id: 1, // Will be set after creating product
  quantity: 2,
  unit_price: 29.99,
  subtotal: 59.98
};

describe('Order Items Handlers', () => {
  let userId: number;
  let categoryId: number;
  let productId: number;
  let orderId: number;

  beforeEach(async () => {
    await createDB();

    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    const productResult = await db.insert(productsTable)
      .values({ ...testProduct, category_id: categoryId })
      .returning()
      .execute();
    productId = productResult[0].id;

    const orderResult = await db.insert(ordersTable)
      .values({ ...testOrder, user_id: userId })
      .returning()
      .execute();
    orderId = orderResult[0].id;
  });

  afterEach(resetDB);

  describe('createOrderItem', () => {
    it('should create an order item successfully', async () => {
      const input: CreateOrderItemInput = {
        ...testOrderItemInput,
        order_id: orderId,
        product_id: productId
      };

      const result = await createOrderItem(input);

      // Verify basic fields
      expect(result.order_id).toEqual(orderId);
      expect(result.product_id).toEqual(productId);
      expect(result.quantity).toEqual(2);
      expect(result.unit_price).toEqual(29.99);
      expect(result.subtotal).toEqual(59.98);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);

      // Verify numeric types
      expect(typeof result.unit_price).toBe('number');
      expect(typeof result.subtotal).toBe('number');
    });

    it('should save order item to database', async () => {
      const input: CreateOrderItemInput = {
        ...testOrderItemInput,
        order_id: orderId,
        product_id: productId
      };

      const result = await createOrderItem(input);

      // Query database directly
      const orderItems = await db.select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.id, result.id))
        .execute();

      expect(orderItems).toHaveLength(1);
      expect(orderItems[0].order_id).toEqual(orderId);
      expect(orderItems[0].product_id).toEqual(productId);
      expect(orderItems[0].quantity).toEqual(2);
      expect(parseFloat(orderItems[0].unit_price)).toEqual(29.99);
      expect(parseFloat(orderItems[0].subtotal)).toEqual(59.98);
    });

    it('should throw error for non-existent order', async () => {
      const input: CreateOrderItemInput = {
        ...testOrderItemInput,
        order_id: 99999, // Non-existent order
        product_id: productId
      };

      await expect(createOrderItem(input)).rejects.toThrow(/order.*does not exist/i);
    });

    it('should throw error for non-existent product', async () => {
      const input: CreateOrderItemInput = {
        ...testOrderItemInput,
        order_id: orderId,
        product_id: 99999 // Non-existent product
      };

      await expect(createOrderItem(input)).rejects.toThrow(/product.*does not exist/i);
    });
  });

  describe('getOrderItems', () => {
    it('should return empty array when no order items exist', async () => {
      const result = await getOrderItems();
      expect(result).toEqual([]);
    });

    it('should return all order items', async () => {
      // Create test order items
      const input1: CreateOrderItemInput = {
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        unit_price: 29.99,
        subtotal: 29.99
      };

      const input2: CreateOrderItemInput = {
        order_id: orderId,
        product_id: productId,
        quantity: 3,
        unit_price: 29.99,
        subtotal: 89.97
      };

      await createOrderItem(input1);
      await createOrderItem(input2);

      const result = await getOrderItems();

      expect(result).toHaveLength(2);
      expect(result[0].quantity).toEqual(1);
      expect(result[1].quantity).toEqual(3);
      
      // Verify numeric conversions
      result.forEach(item => {
        expect(typeof item.unit_price).toBe('number');
        expect(typeof item.subtotal).toBe('number');
      });
    });
  });

  describe('getOrderItemById', () => {
    it('should return null for non-existent order item', async () => {
      const input: GetByIdInput = { id: 99999 };
      const result = await getOrderItemById(input);
      expect(result).toBeNull();
    });

    it('should return order item by ID', async () => {
      const createInput: CreateOrderItemInput = {
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        unit_price: 29.99,
        subtotal: 59.98
      };

      const created = await createOrderItem(createInput);
      const input: GetByIdInput = { id: created.id };

      const result = await getOrderItemById(input);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.order_id).toEqual(orderId);
      expect(result!.product_id).toEqual(productId);
      expect(result!.quantity).toEqual(2);
      expect(result!.unit_price).toEqual(29.99);
      expect(result!.subtotal).toEqual(59.98);

      // Verify numeric types
      expect(typeof result!.unit_price).toBe('number');
      expect(typeof result!.subtotal).toBe('number');
    });
  });

  describe('getOrderItemsByOrderId', () => {
    it('should return empty array for order with no items', async () => {
      const input: GetByIdInput = { id: orderId };
      const result = await getOrderItemsByOrderId(input);
      expect(result).toEqual([]);
    });

    it('should return all order items for specific order', async () => {
      // Create order items for the test order
      const input1: CreateOrderItemInput = {
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        unit_price: 29.99,
        subtotal: 29.99
      };

      const input2: CreateOrderItemInput = {
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        unit_price: 29.99,
        subtotal: 59.98
      };

      await createOrderItem(input1);
      await createOrderItem(input2);

      const getInput: GetByIdInput = { id: orderId };
      const result = await getOrderItemsByOrderId(getInput);

      expect(result).toHaveLength(2);
      expect(result.every(item => item.order_id === orderId)).toBe(true);
      expect(result[0].quantity).toEqual(1);
      expect(result[1].quantity).toEqual(2);

      // Verify numeric conversions
      result.forEach(item => {
        expect(typeof item.unit_price).toBe('number');
        expect(typeof item.subtotal).toBe('number');
      });
    });
  });

  describe('updateOrderItem', () => {
    let orderItemId: number;

    beforeEach(async () => {
      const createInput: CreateOrderItemInput = {
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        unit_price: 29.99,
        subtotal: 59.98
      };

      const created = await createOrderItem(createInput);
      orderItemId = created.id;
    });

    it('should update order item quantity', async () => {
      const input: UpdateOrderItemInput = {
        id: orderItemId,
        quantity: 5,
        subtotal: 149.95
      };

      const result = await updateOrderItem(input);

      expect(result.id).toEqual(orderItemId);
      expect(result.quantity).toEqual(5);
      expect(result.subtotal).toEqual(149.95);
      expect(result.unit_price).toEqual(29.99); // Should remain unchanged

      // Verify numeric types
      expect(typeof result.unit_price).toBe('number');
      expect(typeof result.subtotal).toBe('number');
    });

    it('should update order item unit price', async () => {
      const input: UpdateOrderItemInput = {
        id: orderItemId,
        unit_price: 39.99,
        subtotal: 79.98
      };

      const result = await updateOrderItem(input);

      expect(result.id).toEqual(orderItemId);
      expect(result.unit_price).toEqual(39.99);
      expect(result.subtotal).toEqual(79.98);
      expect(result.quantity).toEqual(2); // Should remain unchanged

      // Verify numeric types
      expect(typeof result.unit_price).toBe('number');
      expect(typeof result.subtotal).toBe('number');
    });

    it('should save updated order item to database', async () => {
      const input: UpdateOrderItemInput = {
        id: orderItemId,
        quantity: 3,
        subtotal: 89.97
      };

      await updateOrderItem(input);

      // Query database directly
      const orderItems = await db.select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.id, orderItemId))
        .execute();

      expect(orderItems).toHaveLength(1);
      expect(orderItems[0].quantity).toEqual(3);
      expect(parseFloat(orderItems[0].subtotal)).toEqual(89.97);
    });

    it('should throw error for non-existent order item', async () => {
      const input: UpdateOrderItemInput = {
        id: 99999,
        quantity: 5
      };

      await expect(updateOrderItem(input)).rejects.toThrow(/order item.*does not exist/i);
    });

    it('should throw error when updating to non-existent order', async () => {
      const input: UpdateOrderItemInput = {
        id: orderItemId,
        order_id: 99999
      };

      await expect(updateOrderItem(input)).rejects.toThrow(/order.*does not exist/i);
    });

    it('should throw error when updating to non-existent product', async () => {
      const input: UpdateOrderItemInput = {
        id: orderItemId,
        product_id: 99999
      };

      await expect(updateOrderItem(input)).rejects.toThrow(/product.*does not exist/i);
    });
  });

  describe('deleteOrderItem', () => {
    it('should delete existing order item', async () => {
      const createInput: CreateOrderItemInput = {
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        unit_price: 29.99,
        subtotal: 59.98
      };

      const created = await createOrderItem(createInput);
      const deleteInput: DeleteInput = { id: created.id };

      const result = await deleteOrderItem(deleteInput);

      expect(result.success).toBe(true);

      // Verify deletion from database
      const orderItems = await db.select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.id, created.id))
        .execute();

      expect(orderItems).toHaveLength(0);
    });

    it('should return success even for non-existent order item', async () => {
      const input: DeleteInput = { id: 99999 };
      const result = await deleteOrderItem(input);

      expect(result.success).toBe(true);
    });
  });
});