import { z } from 'zod';

// Enum schemas
export const userRoleSchema = z.enum(['admin', 'user', 'guest']);
export const orderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

// User schemas
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: userRoleSchema.optional(),
  is_active: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  role: userRoleSchema.optional(),
  is_active: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Category schemas
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  category_id: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  price: z.number().positive('Price must be positive'),
  stock_quantity: z.number().int().nonnegative('Stock quantity must be non-negative').optional(),
  category_id: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive('Price must be positive').optional(),
  stock_quantity: z.number().int().nonnegative('Stock quantity must be non-negative').optional(),
  category_id: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Order schemas
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  status: orderStatusSchema,
  total_amount: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  user_id: z.number(),
  status: orderStatusSchema.optional(),
  total_amount: z.number().nonnegative('Total amount must be non-negative'),
  notes: z.string().nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderInputSchema = z.object({
  id: z.number(),
  user_id: z.number().optional(),
  status: orderStatusSchema.optional(),
  total_amount: z.number().nonnegative('Total amount must be non-negative').optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderInputSchema>;

// Order item schemas
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  subtotal: z.number(),
  created_at: z.coerce.date(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const createOrderItemInputSchema = z.object({
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive'),
  subtotal: z.number().nonnegative('Subtotal must be non-negative'),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemInputSchema>;

export const updateOrderItemInputSchema = z.object({
  id: z.number(),
  order_id: z.number().optional(),
  product_id: z.number().optional(),
  quantity: z.number().int().positive('Quantity must be positive').optional(),
  unit_price: z.number().positive('Unit price must be positive').optional(),
  subtotal: z.number().nonnegative('Subtotal must be non-negative').optional(),
});

export type UpdateOrderItemInput = z.infer<typeof updateOrderItemInputSchema>;

// Common schemas for operations
export const deleteInputSchema = z.object({
  id: z.number(),
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;

export const getByIdInputSchema = z.object({
  id: z.number(),
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;