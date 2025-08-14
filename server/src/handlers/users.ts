import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput, type User, type DeleteInput, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

// Create a new user
export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        name: input.name,
        email: input.email,
        role: input.role || 'user', // Use default if not provided
        is_active: input.is_active ?? true // Use default if not provided
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}

// Get all users
export async function getUsers(): Promise<User[]> {
  try {
    const result = await db.select()
      .from(usersTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(input: GetByIdInput): Promise<User | null> {
  try {
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch user by ID:', error);
    throw error;
  }
}

// Update user
export async function updateUser(input: UpdateUserInput): Promise<User> {
  try {
    // First check if user exists
    const existingUser = await getUserById({ id: input.id });
    if (!existingUser) {
      throw new Error(`User with ID ${input.id} not found`);
    }

    // Build update values, only including provided fields
    const updateValues: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) updateValues.name = input.name;
    if (input.email !== undefined) updateValues.email = input.email;
    if (input.role !== undefined) updateValues.role = input.role;
    if (input.is_active !== undefined) updateValues.is_active = input.is_active;

    // Perform update
    const result = await db.update(usersTable)
      .set(updateValues)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
}

// Delete user
export async function deleteUser(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First check if user exists
    const existingUser = await getUserById({ id: input.id });
    if (!existingUser) {
      throw new Error(`User with ID ${input.id} not found`);
    }

    // Delete the user
    await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}