import { db } from '../db';
import { orderItemsTable, ordersTable, productsTable, usersTable } from '../db/schema';
import { type CreateOrderItemInput, type UpdateOrderItemInput, type OrderItem, type DeleteInput, type GetByIdInput } from '../schema';
import { eq, and } from 'drizzle-orm';

// Create a new order item
export async function createOrderItem(input: CreateOrderItemInput): Promise<OrderItem> {
  try {
    // Verify that the referenced order exists
    const order = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.order_id))
      .limit(1)
      .execute();

    if (order.length === 0) {
      throw new Error(`Order with ID ${input.order_id} does not exist`);
    }

    // Verify that the referenced product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .limit(1)
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with ID ${input.product_id} does not exist`);
    }

    // Insert order item record with numeric field conversions
    const result = await db.insert(orderItemsTable)
      .values({
        order_id: input.order_id,
        product_id: input.product_id,
        quantity: input.quantity,
        unit_price: input.unit_price.toString(), // Convert number to string for numeric column
        subtotal: input.subtotal.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const orderItem = result[0];
    return {
      ...orderItem,
      unit_price: parseFloat(orderItem.unit_price), // Convert string back to number
      subtotal: parseFloat(orderItem.subtotal) // Convert string back to number
    };
  } catch (error) {
    console.error('Order item creation failed:', error);
    throw error;
  }
}

// Get all order items
export async function getOrderItems(): Promise<OrderItem[]> {
  try {
    const results = await db.select()
      .from(orderItemsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price), // Convert string back to number
      subtotal: parseFloat(item.subtotal) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch order items:', error);
    throw error;
  }
}

// Get order item by ID
export async function getOrderItemById(input: GetByIdInput): Promise<OrderItem | null> {
  try {
    const results = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.id, input.id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const item = results[0];
    return {
      ...item,
      unit_price: parseFloat(item.unit_price), // Convert string back to number
      subtotal: parseFloat(item.subtotal) // Convert string back to number
    };
  } catch (error) {
    console.error('Failed to fetch order item by ID:', error);
    throw error;
  }
}

// Get order items by order ID
export async function getOrderItemsByOrderId(input: GetByIdInput): Promise<OrderItem[]> {
  try {
    const results = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, input.id))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price), // Convert string back to number
      subtotal: parseFloat(item.subtotal) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch order items by order ID:', error);
    throw error;
  }
}

// Update order item
export async function updateOrderItem(input: UpdateOrderItemInput): Promise<OrderItem> {
  try {
    // Verify the order item exists
    const existing = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.id, input.id))
      .limit(1)
      .execute();

    if (existing.length === 0) {
      throw new Error(`Order item with ID ${input.id} does not exist`);
    }

    // If updating order_id, verify the new order exists
    if (input.order_id !== undefined) {
      const order = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.id, input.order_id))
        .limit(1)
        .execute();

      if (order.length === 0) {
        throw new Error(`Order with ID ${input.order_id} does not exist`);
      }
    }

    // If updating product_id, verify the new product exists
    if (input.product_id !== undefined) {
      const product = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, input.product_id))
        .limit(1)
        .execute();

      if (product.length === 0) {
        throw new Error(`Product with ID ${input.product_id} does not exist`);
      }
    }

    // Build update values with numeric field conversions
    const updateValues: any = {};
    if (input.order_id !== undefined) updateValues.order_id = input.order_id;
    if (input.product_id !== undefined) updateValues.product_id = input.product_id;
    if (input.quantity !== undefined) updateValues.quantity = input.quantity;
    if (input.unit_price !== undefined) updateValues.unit_price = input.unit_price.toString();
    if (input.subtotal !== undefined) updateValues.subtotal = input.subtotal.toString();

    // Update order item record
    const results = await db.update(orderItemsTable)
      .set(updateValues)
      .where(eq(orderItemsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const orderItem = results[0];
    return {
      ...orderItem,
      unit_price: parseFloat(orderItem.unit_price), // Convert string back to number
      subtotal: parseFloat(orderItem.subtotal) // Convert string back to number
    };
  } catch (error) {
    console.error('Order item update failed:', error);
    throw error;
  }
}

// Delete order item
export async function deleteOrderItem(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(orderItemsTable)
      .where(eq(orderItemsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Order item deletion failed:', error);
    throw error;
  }
}