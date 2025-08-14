import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type UpdateProductInput, type GetByIdInput, type DeleteInput } from '../schema';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from '../handlers/products';
import { eq } from 'drizzle-orm';

// Test inputs with all fields
const testProductInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 19.99,
  stock_quantity: 100,
  category_id: null,
  is_active: true
};

const testProductInputMinimal: CreateProductInput = {
  name: 'Minimal Product',
  price: 9.99
};

describe('Product Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createProduct', () => {
    it('should create a product with all fields', async () => {
      const result = await createProduct(testProductInput);

      expect(result.name).toEqual('Test Product');
      expect(result.description).toEqual('A product for testing');
      expect(result.price).toEqual(19.99);
      expect(typeof result.price).toBe('number');
      expect(result.stock_quantity).toEqual(100);
      expect(result.category_id).toBeNull();
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a product with minimal fields and defaults', async () => {
      const result = await createProduct(testProductInputMinimal);

      expect(result.name).toEqual('Minimal Product');
      expect(result.description).toBeNull();
      expect(result.price).toEqual(9.99);
      expect(typeof result.price).toBe('number');
      expect(result.stock_quantity).toEqual(0); // Default value
      expect(result.category_id).toBeNull();
      expect(result.is_active).toBe(true); // Default value
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save product to database', async () => {
      const result = await createProduct(testProductInput);

      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, result.id))
        .execute();

      expect(products).toHaveLength(1);
      expect(products[0].name).toEqual('Test Product');
      expect(products[0].description).toEqual('A product for testing');
      expect(parseFloat(products[0].price)).toEqual(19.99);
      expect(products[0].stock_quantity).toEqual(100);
      expect(products[0].is_active).toBe(true);
    });

    it('should create product with valid category_id', async () => {
      // First create a category
      const categoryResult = await db.insert(categoriesTable)
        .values({
          name: 'Electronics',
          description: 'Electronic products'
        })
        .returning()
        .execute();

      const categoryId = categoryResult[0].id;

      const productInput: CreateProductInput = {
        ...testProductInput,
        category_id: categoryId
      };

      const result = await createProduct(productInput);

      expect(result.category_id).toEqual(categoryId);

      // Verify in database
      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, result.id))
        .execute();

      expect(products[0].category_id).toEqual(categoryId);
    });
  });

  describe('getProducts', () => {
    it('should return empty array when no products exist', async () => {
      const result = await getProducts();

      expect(result).toEqual([]);
    });

    it('should return all products', async () => {
      // Create test products
      await createProduct(testProductInput);
      await createProduct({ ...testProductInputMinimal, name: 'Second Product' });

      const result = await getProducts();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Product');
      expect(result[1].name).toEqual('Second Product');
      
      // Verify numeric conversion
      expect(typeof result[0].price).toBe('number');
      expect(typeof result[1].price).toBe('number');
    });

    it('should return products with correct field types', async () => {
      await createProduct(testProductInput);

      const result = await getProducts();

      expect(result).toHaveLength(1);
      const product = result[0];
      
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.stock_quantity).toBe('number');
      expect(typeof product.is_active).toBe('boolean');
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getProductById', () => {
    it('should return null when product does not exist', async () => {
      const input: GetByIdInput = { id: 999 };
      const result = await getProductById(input);

      expect(result).toBeNull();
    });

    it('should return product when it exists', async () => {
      const createdProduct = await createProduct(testProductInput);
      const input: GetByIdInput = { id: createdProduct.id };

      const result = await getProductById(input);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(createdProduct.id);
      expect(result!.name).toEqual('Test Product');
      expect(result!.price).toEqual(19.99);
      expect(typeof result!.price).toBe('number');
    });

    it('should return product with correct field types', async () => {
      const createdProduct = await createProduct(testProductInput);
      const input: GetByIdInput = { id: createdProduct.id };

      const result = await getProductById(input);

      expect(result).not.toBeNull();
      expect(typeof result!.id).toBe('number');
      expect(typeof result!.name).toBe('string');
      expect(typeof result!.price).toBe('number');
      expect(typeof result!.stock_quantity).toBe('number');
      expect(typeof result!.is_active).toBe('boolean');
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('updateProduct', () => {
    it('should update product with all fields', async () => {
      const createdProduct = await createProduct(testProductInput);

      const updateInput: UpdateProductInput = {
        id: createdProduct.id,
        name: 'Updated Product',
        description: 'Updated description',
        price: 29.99,
        stock_quantity: 50,
        category_id: null,
        is_active: false
      };

      const result = await updateProduct(updateInput);

      expect(result.id).toEqual(createdProduct.id);
      expect(result.name).toEqual('Updated Product');
      expect(result.description).toEqual('Updated description');
      expect(result.price).toEqual(29.99);
      expect(typeof result.price).toBe('number');
      expect(result.stock_quantity).toEqual(50);
      expect(result.is_active).toBe(false);
      expect(result.updated_at > createdProduct.updated_at).toBe(true);
    });

    it('should update only specified fields', async () => {
      const createdProduct = await createProduct(testProductInput);

      const updateInput: UpdateProductInput = {
        id: createdProduct.id,
        name: 'Updated Name Only',
        price: 39.99
      };

      const result = await updateProduct(updateInput);

      expect(result.name).toEqual('Updated Name Only');
      expect(result.price).toEqual(39.99);
      expect(typeof result.price).toBe('number');
      expect(result.description).toEqual(createdProduct.description); // Unchanged
      expect(result.stock_quantity).toEqual(createdProduct.stock_quantity); // Unchanged
      expect(result.is_active).toEqual(createdProduct.is_active); // Unchanged
    });

    it('should update product in database', async () => {
      const createdProduct = await createProduct(testProductInput);

      const updateInput: UpdateProductInput = {
        id: createdProduct.id,
        name: 'Database Updated Product'
      };

      await updateProduct(updateInput);

      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, createdProduct.id))
        .execute();

      expect(products).toHaveLength(1);
      expect(products[0].name).toEqual('Database Updated Product');
    });

    it('should throw error when product does not exist', async () => {
      const updateInput: UpdateProductInput = {
        id: 999,
        name: 'Non-existent Product'
      };

      await expect(updateProduct(updateInput)).rejects.toThrow(/Product with ID 999 not found/i);
    });

    it('should update category_id correctly', async () => {
      // Create a category first
      const categoryResult = await db.insert(categoriesTable)
        .values({
          name: 'Updated Category',
          description: 'Category for update test'
        })
        .returning()
        .execute();

      const categoryId = categoryResult[0].id;
      const createdProduct = await createProduct(testProductInput);

      const updateInput: UpdateProductInput = {
        id: createdProduct.id,
        category_id: categoryId
      };

      const result = await updateProduct(updateInput);

      expect(result.category_id).toEqual(categoryId);

      // Verify in database
      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, createdProduct.id))
        .execute();

      expect(products[0].category_id).toEqual(categoryId);
    });
  });

  describe('deleteProduct', () => {
    it('should delete existing product', async () => {
      const createdProduct = await createProduct(testProductInput);
      const deleteInput: DeleteInput = { id: createdProduct.id };

      const result = await deleteProduct(deleteInput);

      expect(result.success).toBe(true);

      // Verify product is deleted from database
      const products = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, createdProduct.id))
        .execute();

      expect(products).toHaveLength(0);
    });

    it('should return false when product does not exist', async () => {
      const deleteInput: DeleteInput = { id: 999 };

      const result = await deleteProduct(deleteInput);

      expect(result.success).toBe(false);
    });

    it('should not affect other products when deleting one', async () => {
      const product1 = await createProduct(testProductInput);
      const product2 = await createProduct({ ...testProductInputMinimal, name: 'Keep This Product' });

      const deleteInput: DeleteInput = { id: product1.id };
      await deleteProduct(deleteInput);

      // Verify product2 still exists
      const remainingProducts = await db.select()
        .from(productsTable)
        .execute();

      expect(remainingProducts).toHaveLength(1);
      expect(remainingProducts[0].id).toEqual(product2.id);
      expect(remainingProducts[0].name).toEqual('Keep This Product');
    });
  });
});