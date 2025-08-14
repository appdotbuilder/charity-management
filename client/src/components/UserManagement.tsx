import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UpdateUserInput } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    role: 'user',
    is_active: true
  });

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.users.getAll.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const updateData: UpdateUserInput = {
          id: editingUser.id,
          ...formData
        };
        const updatedUser = await trpc.users.update.mutate(updateData);
        setUsers((prev: User[]) => prev.map((u: User) => u.id === updatedUser.id ? updatedUser : u));
        setEditingUser(null);
      } else {
        // Create new user
        const newUser = await trpc.users.create.mutate(formData);
        setUsers((prev: User[]) => [...prev, newUser]);
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'user',
        is_active: true
      });
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
  };

  const handleDelete = async (userId: number) => {
    try {
      await trpc.users.delete.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter user name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role || 'user'}
                  onValueChange={(value: 'admin' | 'user' | 'guest') =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Active Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="is_active" className="text-sm">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </Button>
              {editingUser && (
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
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users found. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {users.map((user: User) => (
                <div key={user.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'user' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? '✅ Active' : '❌ Inactive'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-1">📧 {user.email}</p>
                    <p className="text-sm text-gray-400">
                      Created: {user.created_at.toLocaleDateString()} | Updated: {user.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
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
                            This will permanently delete the user "{user.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)}>
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