import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { OrderItem, CreateOrderItemInput, UpdateOrderItemInput, Order, Product } from '../../../server/src/schema';

export function OrderItemManagement() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateOrderItemInput>({
    order_id: 0,
    product_id: 0,
    quantity: 1,
    unit_price: 0,
    subtotal: 0
  });

  const loadOrderItems = useCallback(async () => {
    try {
      const result = await trpc.orderItems.getAll.query();
      setOrderItems(result);
    } catch (error) {
      console.error('Failed to load order items:', error);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const result = await trpc.orders.getAll.query();
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const result = await trpc.products.getAll.query();
      setProducts(result.filter((product: Product) => product.is_active));
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  useEffect(() => {
    loadOrderItems();
    loadOrders();
    loadProducts();
  }, [loadOrderItems, loadOrders, loadProducts]);

  // Calculate subtotal when quantity or unit_price changes
  useEffect(() => {
    const subtotal = formData.quantity * formData.unit_price;
    setFormData((prev: CreateOrderItemInput) => ({ ...prev, subtotal }));
  }, [formData.quantity, formData.unit_price]);

  // Update unit_price when product changes
  const handleProductChange = (productId: string) => {
    const product = products.find((p: Product) => p.id === parseInt(productId));
    setFormData((prev: CreateOrderItemInput) => ({
      ...prev,
      product_id: parseInt(productId),
      unit_price: product ? product.price : 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingOrderItem) {
        // Update existing order item
        const updateData: UpdateOrderItemInput = {
          id: editingOrderItem.id,
          ...formData
        };
        const updatedOrderItem = await trpc.orderItems.update.mutate(updateData);
        setOrderItems((prev: OrderItem[]) => prev.map((oi: OrderItem) => oi.id === updatedOrderItem.id ? updatedOrderItem : oi));
        setEditingOrderItem(null);
      } else {
        // Create new order item
        const newOrderItem = await trpc.orderItems.create.mutate(formData);
        setOrderItems((prev: OrderItem[]) => [...prev, newOrderItem]);
      }
      
      // Reset form
      setFormData({
        order_id: 0,
        product_id: 0,
        quantity: 1,
        unit_price: 0,
        subtotal: 0
      });
    } catch (error) {
      console.error('Failed to save order item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (orderItem: OrderItem) => {
    setEditingOrderItem(orderItem);
    setFormData({
      order_id: orderItem.order_id,
      product_id: orderItem.product_id,
      quantity: orderItem.quantity,
      unit_price: orderItem.unit_price,
      subtotal: orderItem.subtotal
    });
  };

  const handleDelete = async (orderItemId: number) => {
    try {
      await trpc.orderItems.delete.mutate({ id: orderItemId });
      setOrderItems((prev: OrderItem[]) => prev.filter((oi: OrderItem) => oi.id !== orderItemId));
    } catch (error) {
      console.error('Failed to delete order item:', error);
    }
  };

  const cancelEdit = () => {
    setEditingOrderItem(null);
    setFormData({
      order_id: 0,
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      subtotal: 0
    });
  };

  const getOrderInfo = (orderId: number): string => {
    const order = orders.find((o: Order) => o.id === orderId);
    return order ? `Order #${order.id} (${order.status})` : 'Unknown Order';
  };

  const getProductName = (productId: number): string => {
    const product = products.find((p: Product) => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingOrderItem ? 'Edit Order Item' : 'Create New Order Item'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_id">Order</Label>
                <Select
                  value={formData.order_id.toString()}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateOrderItemInput) => ({ ...prev, order_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order: Order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        Order #{order.id} - ${order.total_amount.toFixed(2)} ({order.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_id">Product</Label>
                <Select
                  value={formData.product_id.toString()}
                  onValueChange={handleProductChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - ${product.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateOrderItemInput) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                  }
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price ($)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  placeholder="0.00"
                  value={formData.unit_price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateOrderItemInput) => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))
                  }
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal ($)</Label>
                <Input
                  id="subtotal"
                  type="number"
                  value={formData.subtotal.toFixed(2)}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || formData.order_id === 0 || formData.product_id === 0}>
                {isLoading ? 'Saving...' : editingOrderItem ? 'Update Order Item' : 'Create Order Item'}
              </Button>
              {editingOrderItem && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Items ({orderItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No order items found. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {orderItems.map((orderItem: OrderItem) => (
                <div key={orderItem.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">📝 Item #{orderItem.id}</h3>
                      <Badge variant="outline">
                        📋 {getOrderInfo(orderItem.order_id)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 mb-2">
                      <p className="text-gray-600">📦 Product: {getProductName(orderItem.product_id)}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Quantity: {orderItem.quantity}</span>
                        <span className="text-sm text-gray-600">Unit Price: ${orderItem.unit_price.toFixed(2)}</span>
                        <span className="text-lg font-semibold text-green-600">
                          💰 Subtotal: ${orderItem.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      Created: {orderItem.created_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(orderItem)}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete Order Item #{orderItem.id}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(orderItem.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}