import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type UpdateCategoryInput, type DeleteInput, type GetByIdInput } from '../schema';
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from '../handlers/categories';
import { eq } from 'drizzle-orm';

// Test input data
const testCategoryInput: CreateCategoryInput = {
  name: 'Electronics',
  description: 'Electronic devices and accessories',
  is_active: true
};

const minimalCategoryInput: CreateCategoryInput = {
  name: 'Books'
  // description and is_active are optional
};

describe('Categories Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createCategory', () => {
    it('should create a category with all fields', async () => {
      const result = await createCategory(testCategoryInput);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.name).toEqual('Electronics');
      expect(result.description).toEqual('Electronic devices and accessories');
      expect(result.is_active).toBe(true);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a category with minimal fields', async () => {
      const result = await createCategory(minimalCategoryInput);

      expect(result.id).toBeDefined();
      expect(result.name).toEqual('Books');
      expect(result.description).toBeNull();
      expect(result.is_active).toBe(true); // Default value
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save category to database', async () => {
      const result = await createCategory(testCategoryInput);

      const categories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, result.id))
        .execute();

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toEqual('Electronics');
      expect(categories[0].description).toEqual('Electronic devices and accessories');
      expect(categories[0].is_active).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('should return empty array when no categories exist', async () => {
      const result = await getCategories();
      expect(result).toEqual([]);
    });

    it('should return all categories', async () => {
      // Create test categories
      await createCategory({ name: 'Electronics', description: 'Tech items', is_active: true });
      await createCategory({ name: 'Books', description: null, is_active: false });
      await createCategory({ name: 'Clothing' });

      const result = await getCategories();

      expect(result).toHaveLength(3);
      expect(result[0].name).toEqual('Electronics');
      expect(result[1].name).toEqual('Books');
      expect(result[2].name).toEqual('Clothing');
    });

    it('should return categories with correct data types', async () => {
      await createCategory(testCategoryInput);

      const result = await getCategories();

      expect(result).toHaveLength(1);
      const category = result[0];
      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(typeof category.is_active).toBe('boolean');
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getCategoryById', () => {
    it('should return null when category does not exist', async () => {
      const input: GetByIdInput = { id: 999 };
      const result = await getCategoryById(input);
      expect(result).toBeNull();
    });

    it('should return category when it exists', async () => {
      const created = await createCategory(testCategoryInput);
      
      const input: GetByIdInput = { id: created.id };
      const result = await getCategoryById(input);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Electronics');
      expect(result!.description).toEqual('Electronic devices and accessories');
      expect(result!.is_active).toBe(true);
    });

    it('should return category with correct data types', async () => {
      const created = await createCategory(testCategoryInput);
      
      const input: GetByIdInput = { id: created.id };
      const result = await getCategoryById(input);

      expect(result).not.toBeNull();
      expect(typeof result!.id).toBe('number');
      expect(typeof result!.name).toBe('string');
      expect(typeof result!.is_active).toBe('boolean');
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('updateCategory', () => {
    it('should update all category fields', async () => {
      const created = await createCategory(testCategoryInput);
      
      const updateInput: UpdateCategoryInput = {
        id: created.id,
        name: 'Updated Electronics',
        description: 'Updated description',
        is_active: false
      };

      const result = await updateCategory(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Electronics');
      expect(result.description).toEqual('Updated description');
      expect(result.is_active).toBe(false);
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update only specified fields', async () => {
      const created = await createCategory(testCategoryInput);
      
      const updateInput: UpdateCategoryInput = {
        id: created.id,
        name: 'Partially Updated'
        // description and is_active not specified
      };

      const result = await updateCategory(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Partially Updated');
      expect(result.description).toEqual('Electronic devices and accessories'); // Unchanged
      expect(result.is_active).toBe(true); // Unchanged
    });

    it('should update category in database', async () => {
      const created = await createCategory(testCategoryInput);
      
      const updateInput: UpdateCategoryInput = {
        id: created.id,
        name: 'Database Updated',
        is_active: false
      };

      await updateCategory(updateInput);

      const categories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, created.id))
        .execute();

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toEqual('Database Updated');
      expect(categories[0].is_active).toBe(false);
    });

    it('should throw error when category does not exist', async () => {
      const updateInput: UpdateCategoryInput = {
        id: 999,
        name: 'Non-existent Category'
      };

      expect(updateCategory(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteCategory', () => {
    it('should delete existing category', async () => {
      const created = await createCategory(testCategoryInput);
      
      const deleteInput: DeleteInput = { id: created.id };
      const result = await deleteCategory(deleteInput);

      expect(result.success).toBe(true);

      // Verify category is deleted from database
      const categories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, created.id))
        .execute();

      expect(categories).toHaveLength(0);
    });

    it('should return false when category does not exist', async () => {
      const deleteInput: DeleteInput = { id: 999 };
      const result = await deleteCategory(deleteInput);

      expect(result.success).toBe(false);
    });

    it('should not affect other categories when deleting one', async () => {
      const category1 = await createCategory({ name: 'Category 1' });
      const category2 = await createCategory({ name: 'Category 2' });
      
      const deleteInput: DeleteInput = { id: category1.id };
      const result = await deleteCategory(deleteInput);

      expect(result.success).toBe(true);

      // Verify only the intended category was deleted
      const remainingCategories = await getCategories();
      expect(remainingCategories).toHaveLength(1);
      expect(remainingCategories[0].id).toEqual(category2.id);
      expect(remainingCategories[0].name).toEqual('Category 2');
    });
  });
});