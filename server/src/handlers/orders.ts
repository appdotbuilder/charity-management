import { db } from '../db';
import { ordersTable, usersTable } from '../db/schema';
import { type CreateOrderInput, type UpdateOrderInput, type Order, type DeleteInput, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

// Create a new order
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  try {
    // Verify that user exists before creating order
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Insert order record
    const result = await db.insert(ordersTable)
      .values({
        user_id: input.user_id,
        status: input.status || 'pending',
        total_amount: input.total_amount.toString(), // Convert number to string for numeric column
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const order = result[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}

// Get all orders
export async function getOrders(): Promise<Order[]> {
  try {
    const results = await db.select()
      .from(ordersTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}

// Get order by ID
export async function getOrderById(input: GetByIdInput): Promise<Order | null> {
  try {
    const results = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const order = results[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Failed to fetch order by ID:', error);
    throw error;
  }
}

// Update order
export async function updateOrder(input: UpdateOrderInput): Promise<Order> {
  try {
    // If user_id is being updated, verify the user exists
    if (input.user_id !== undefined) {
      const existingUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.user_id))
        .execute();

      if (existingUser.length === 0) {
        throw new Error(`User with id ${input.user_id} not found`);
      }
    }

    // Build update object, converting numeric fields to strings
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.user_id !== undefined) updateData.user_id = input.user_id;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.total_amount !== undefined) updateData.total_amount = input.total_amount.toString();
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Update order record
    const result = await db.update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Order with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const order = result[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Order update failed:', error);
    throw error;
  }
}

// Delete order
export async function deleteOrder(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(ordersTable)
      .where(eq(ordersTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Order deletion failed:', error);
    throw error;
  }
}