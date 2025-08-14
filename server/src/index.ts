import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema, 
  updateUserInputSchema, 
  createCategoryInputSchema, 
  updateCategoryInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  createOrderInputSchema,
  updateOrderInputSchema,
  createOrderItemInputSchema,
  updateOrderItemInputSchema,
  deleteInputSchema,
  getByIdInputSchema
} from './schema';

// Import handlers
import { createUser, getUsers, getUserById, updateUser, deleteUser } from './handlers/users';
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from './handlers/categories';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from './handlers/products';
import { createOrder, getOrders, getOrderById, updateOrder, deleteOrder } from './handlers/orders';
import { createOrderItem, getOrderItems, getOrderItemById, getOrderItemsByOrderId, updateOrderItem, deleteOrderItem } from './handlers/order-items';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  users: router({
    create: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => createUser(input)),
    getAll: publicProcedure
      .query(() => getUsers()),
    getById: publicProcedure
      .input(getByIdInputSchema)
      .query(({ input }) => getUserById(input)),
    update: publicProcedure
      .input(updateUserInputSchema)
      .mutation(({ input }) => updateUser(input)),
    delete: publicProcedure
      .input(deleteInputSchema)
      .mutation(({ input }) => deleteUser(input)),
  }),

  // Category routes
  categories: router({
    create: publicProcedure
      .input(createCategoryInputSchema)
      .mutation(({ input }) => createCategory(input)),
    getAll: publicProcedure
      .query(() => getCategories()),
    getById: publicProcedure
      .input(getByIdInputSchema)
      .query(({ input }) => getCategoryById(input)),
    update: publicProcedure
      .input(updateCategoryInputSchema)
      .mutation(({ input }) => updateCategory(input)),
    delete: publicProcedure
      .input(deleteInputSchema)
      .mutation(({ input }) => deleteCategory(input)),
  }),

  // Product routes
  products: router({
    create: publicProcedure
      .input(createProductInputSchema)
      .mutation(({ input }) => createProduct(input)),
    getAll: publicProcedure
      .query(() => getProducts()),
    getById: publicProcedure
      .input(getByIdInputSchema)
      .query(({ input }) => getProductById(input)),
    update: publicProcedure
      .input(updateProductInputSchema)
      .mutation(({ input }) => updateProduct(input)),
    delete: publicProcedure
      .input(deleteInputSchema)
      .mutation(({ input }) => deleteProduct(input)),
  }),

  // Order routes
  orders: router({
    create: publicProcedure
      .input(createOrderInputSchema)
      .mutation(({ input }) => createOrder(input)),
    getAll: publicProcedure
      .query(() => getOrders()),
    getById: publicProcedure
      .input(getByIdInputSchema)
      .query(({ input }) => getOrderById(input)),
    update: publicProcedure
      .input(updateOrderInputSchema)
      .mutation(({ input }) => updateOrder(input)),
    delete: publicProcedure
      .input(deleteInputSchema)
      .mutation(({ input }) => deleteOrder(input)),
  }),

  // Order item routes
  orderItems: router({
    create: publicProcedure
      .input(createOrderItemInputSchema)
      .mutation(({ input }) => createOrderItem(input)),
    getAll: publicProcedure
      .query(() => getOrderItems()),
    getById: publicProcedure
      .input(getByIdInputSchema)
      .query(({ input }) => getOrderItemById(input)),
    getByOrderId: publicProcedure
      .input(getByIdInputSchema)
      .query(({ input }) => getOrderItemsByOrderId(input)),
    update: publicProcedure
      .input(updateOrderItemInputSchema)
      .mutation(({ input }) => updateOrderItem(input)),
    delete: publicProcedure
      .input(deleteInputSchema)
      .mutation(({ input }) => deleteOrderItem(input)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();