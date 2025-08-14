import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Order, CreateOrderInput, UpdateOrderInput, User } from '../../../server/src/schema';

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateOrderInput>({
    user_id: 0,
    status: 'pending',
    total_amount: 0,
    notes: null
  });

  const loadOrders = useCallback(async () => {
    try {
      const result = await trpc.orders.getAll.query();
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.users.getAll.query();
      setUsers(result.filter((user: User) => user.is_active));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadUsers();
  }, [loadOrders, loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingOrder) {
        // Update existing order
        const updateData: UpdateOrderInput = {
          id: editingOrder.id,
          ...formData
        };
        const updatedOrder = await trpc.orders.update.mutate(updateData);
        setOrders((prev: Order[]) => prev.map((o: Order) => o.id === updatedOrder.id ? updatedOrder : o));
        setEditingOrder(null);
      } else {
        // Create new order
        const newOrder = await trpc.orders.create.mutate(formData);
        setOrders((prev: Order[]) => [...prev, newOrder]);
      }
      
      // Reset form
      setFormData({
        user_id: 0,
        status: 'pending',
        total_amount: 0,
        notes: null
      });
    } catch (error) {
      console.error('Failed to save order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      user_id: order.user_id,
      status: order.status,
      total_amount: order.total_amount,
      notes: order.notes
    });
  };

  const handleDelete = async (orderId: number) => {
    try {
      await trpc.orders.delete.mutate({ id: orderId });
      setOrders((prev: Order[]) => prev.filter((o: Order) => o.id !== orderId));
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const cancelEdit = () => {
    setEditingOrder(null);
    setFormData({
      user_id: 0,
      status: 'pending',
      total_amount: 0,
      notes: null
    });
  };

  const getUserName = (userId: number): string => {
    const user = users.find((u: User) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingOrder ? 'Edit Order' : 'Create New Order'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Customer</Label>
                <Select
                  value={formData.user_id.toString()}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateOrderInput) => ({ ...prev, user_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'pending'}
                  onValueChange={(value: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') =>
                    setFormData((prev: CreateOrderInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="processing">🔄 Processing</SelectItem>
                    <SelectItem value="shipped">🚚 Shipped</SelectItem>
                    <SelectItem value="delivered">✅ Delivered</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount ($)</Label>
              <Input
                id="total_amount"
                type="number"
                placeholder="0.00"
                value={formData.total_amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateOrderInput) => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))
                }
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter order notes"
                value={formData.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateOrderInput) => ({
                    ...prev,
                    notes: e.target.value || null
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || formData.user_id === 0}>
                {isLoading ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
              </Button>
              {editingOrder && (
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
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No orders found. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div key={order.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">📋 Order #{order.id}</h3>
                      <Badge variant={getStatusColor(order.status)}>
                        {getStatusEmoji(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 mb-2">
                      <p className="text-gray-600">👤 Customer: {getUserName(order.user_id)}</p>
                      <p className="text-lg font-semibold text-green-600">💰 Total: ${order.total_amount.toFixed(2)}</p>
                      {order.notes && (
                        <p className="text-gray-600">📝 Notes: {order.notes}</p>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      Created: {order.created_at.toLocaleDateString()} | Updated: {order.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(order)}
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
                            This will permanently delete Order #{order.id}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(order.id)}>
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