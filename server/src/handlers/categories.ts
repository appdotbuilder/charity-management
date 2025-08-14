import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type UpdateCategoryInput, type Category, type DeleteInput, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

// Create a new category
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  try {
    const result = await db.insert(categoriesTable)
      .values({
        name: input.name,
        description: input.description || null,
        is_active: input.is_active ?? true,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const result = await db.select()
      .from(categoriesTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Category fetch failed:', error);
    throw error;
  }
}

// Get category by ID
export async function getCategoryById(input: GetByIdInput): Promise<Category | null> {
  try {
    const result = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Category fetch by ID failed:', error);
    throw error;
  }
}

// Update category
export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  try {
    const updateData: Partial<typeof categoriesTable.$inferInsert> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db.update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Category with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
}

// Delete category
export async function deleteCategory(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}