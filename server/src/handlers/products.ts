import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type UpdateProductInput, type Product, type DeleteInput, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

// Create a new product
export async function createProduct(input: CreateProductInput): Promise<Product> {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        description: input.description || null,
        price: input.price.toString(), // Convert number to string for numeric column
        stock_quantity: input.stock_quantity ?? 0,
        category_id: input.category_id || null,
        is_active: input.is_active ?? true
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
}

// Get all products
export async function getProducts(): Promise<Product[]> {
  try {
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

// Get product by ID
export async function getProductById(input: GetByIdInput): Promise<Product | null> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const product = results[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Failed to fetch product by ID:', error);
    throw error;
  }
}

// Update product
export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  try {
    // Build update values object with only provided fields
    const updateValues: any = {};
    
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.price !== undefined) updateValues.price = input.price.toString(); // Convert number to string
    if (input.stock_quantity !== undefined) updateValues.stock_quantity = input.stock_quantity;
    if (input.category_id !== undefined) updateValues.category_id = input.category_id;
    if (input.is_active !== undefined) updateValues.is_active = input.is_active;

    // Always update the updated_at timestamp
    updateValues.updated_at = new Date();

    const results = await db.update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (results.length === 0) {
      throw new Error(`Product with ID ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const product = results[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
}

// Delete product
export async function deleteProduct(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    const results = await db.delete(productsTable)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    return { success: results.length > 0 };
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
}