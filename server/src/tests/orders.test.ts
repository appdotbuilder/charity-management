import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, usersTable } from '../db/schema';
import { type CreateOrderInput, type UpdateOrderInput, type GetByIdInput, type DeleteInput } from '../schema';
import { createOrder, getOrders, getOrderById, updateOrder, deleteOrder } from '../handlers/orders';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  is_active: true
};

// Test order input
const testOrderInput: CreateOrderInput = {
  user_id: 1, // Will be set after creating user
  status: 'pending',
  total_amount: 99.99,
  notes: 'Test order notes'
};

describe('Order Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const result = await createOrder(orderInput);

      // Verify order fields
      expect(result.user_id).toEqual(userId);
      expect(result.status).toEqual('pending');
      expect(result.total_amount).toEqual(99.99);
      expect(typeof result.total_amount).toEqual('number');
      expect(result.notes).toEqual('Test order notes');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create order with default status when not provided', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = {
        user_id: userId,
        total_amount: 50.00,
        notes: null
      };

      const result = await createOrder(orderInput);

      expect(result.status).toEqual('pending');
      expect(result.notes).toBeNull();
    });

    it('should save order to database', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const result = await createOrder(orderInput);

      // Query database to verify order was saved
      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.id, result.id))
        .execute();

      expect(orders).toHaveLength(1);
      expect(orders[0].user_id).toEqual(userId);
      expect(parseFloat(orders[0].total_amount)).toEqual(99.99);
      expect(orders[0].status).toEqual('pending');
      expect(orders[0].notes).toEqual('Test order notes');
    });

    it('should throw error when user does not exist', async () => {
      const orderInput = { ...testOrderInput, user_id: 999 }; // Non-existent user

      await expect(createOrder(orderInput)).rejects.toThrow(/User with id 999 not found/i);
    });
  });

  describe('getOrders', () => {
    it('should return empty array when no orders exist', async () => {
      const result = await getOrders();

      expect(result).toEqual([]);
    });

    it('should return all orders', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      // Create multiple orders
      const order1Input = { ...testOrderInput, user_id: userId, total_amount: 50.00 };
      const order2Input = { ...testOrderInput, user_id: userId, total_amount: 75.50, status: 'processing' as const };

      await createOrder(order1Input);
      await createOrder(order2Input);

      const result = await getOrders();

      expect(result).toHaveLength(2);
      expect(result[0].total_amount).toEqual(50.00);
      expect(typeof result[0].total_amount).toEqual('number');
      expect(result[1].total_amount).toEqual(75.50);
      expect(typeof result[1].total_amount).toEqual('number');
      expect(result[0].status).toEqual('pending');
      expect(result[1].status).toEqual('processing');
    });
  });

  describe('getOrderById', () => {
    it('should return order when it exists', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const createdOrder = await createOrder(orderInput);

      const input: GetByIdInput = { id: createdOrder.id };
      const result = await getOrderById(input);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(createdOrder.id);
      expect(result!.user_id).toEqual(userId);
      expect(result!.total_amount).toEqual(99.99);
      expect(typeof result!.total_amount).toEqual('number');
      expect(result!.status).toEqual('pending');
    });

    it('should return null when order does not exist', async () => {
      const input: GetByIdInput = { id: 999 };
      const result = await getOrderById(input);

      expect(result).toBeNull();
    });
  });

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const createdOrder = await createOrder(orderInput);

      const updateInput: UpdateOrderInput = {
        id: createdOrder.id,
        status: 'shipped',
        total_amount: 150.00,
        notes: 'Updated notes'
      };

      const result = await updateOrder(updateInput);

      expect(result.id).toEqual(createdOrder.id);
      expect(result.status).toEqual('shipped');
      expect(result.total_amount).toEqual(150.00);
      expect(typeof result.total_amount).toEqual('number');
      expect(result.notes).toEqual('Updated notes');
      expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
    });

    it('should update only provided fields', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const createdOrder = await createOrder(orderInput);

      const updateInput: UpdateOrderInput = {
        id: createdOrder.id,
        status: 'delivered'
      };

      const result = await updateOrder(updateInput);

      expect(result.status).toEqual('delivered');
      expect(result.total_amount).toEqual(99.99); // Should remain unchanged
      expect(result.notes).toEqual('Test order notes'); // Should remain unchanged
      expect(result.user_id).toEqual(userId); // Should remain unchanged
    });

    it('should update order in database', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const createdOrder = await createOrder(orderInput);

      const updateInput: UpdateOrderInput = {
        id: createdOrder.id,
        status: 'cancelled',
        total_amount: 0.00
      };

      await updateOrder(updateInput);

      // Query database to verify update
      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.id, createdOrder.id))
        .execute();

      expect(orders).toHaveLength(1);
      expect(orders[0].status).toEqual('cancelled');
      expect(parseFloat(orders[0].total_amount)).toEqual(0.00);
    });

    it('should throw error when order does not exist', async () => {
      const updateInput: UpdateOrderInput = {
        id: 999,
        status: 'shipped'
      };

      await expect(updateOrder(updateInput)).rejects.toThrow(/Order with id 999 not found/i);
    });

    it('should throw error when updating with non-existent user_id', async () => {
      // Create prerequisite user and order
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const createdOrder = await createOrder(orderInput);

      const updateInput: UpdateOrderInput = {
        id: createdOrder.id,
        user_id: 999 // Non-existent user
      };

      await expect(updateOrder(updateInput)).rejects.toThrow(/User with id 999 not found/i);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order successfully', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const createdOrder = await createOrder(orderInput);

      const deleteInput: DeleteInput = { id: createdOrder.id };
      const result = await deleteOrder(deleteInput);

      expect(result.success).toBe(true);
    });

    it('should remove order from database', async () => {
      // Create prerequisite user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();
      const userId = userResult[0].id;

      const orderInput = { ...testOrderInput, user_id: userId };
      const createdOrder = await createOrder(orderInput);

      const deleteInput: DeleteInput = { id: createdOrder.id };
      await deleteOrder(deleteInput);

      // Verify order was deleted
      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.id, createdOrder.id))
        .execute();

      expect(orders).toHaveLength(0);
    });

    it('should return false when order does not exist', async () => {
      const deleteInput: DeleteInput = { id: 999 };
      const result = await deleteOrder(deleteInput);

      expect(result.success).toBe(false);
    });
  });
});