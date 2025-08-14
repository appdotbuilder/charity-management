import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../../server/src/schema';

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null,
    is_active: true
  });

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.categories.getAll.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        const updateData: UpdateCategoryInput = {
          id: editingCategory.id,
          ...formData
        };
        const updatedCategory = await trpc.categories.update.mutate(updateData);
        setCategories((prev: Category[]) => prev.map((c: Category) => c.id === updatedCategory.id ? updatedCategory : c));
        setEditingCategory(null);
      } else {
        // Create new category
        const newCategory = await trpc.categories.create.mutate(formData);
        setCategories((prev: Category[]) => [...prev, newCategory]);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: null,
        is_active: true
      });
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      is_active: category.is_active
    });
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await trpc.categories.delete.mutate({ id: categoryId });
      setCategories((prev: Category[]) => prev.filter((c: Category) => c.id !== categoryId));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: null,
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter category description"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateCategoryInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Active Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: CreateCategoryInput) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active" className="text-sm">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
              {editingCategory && (
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
          <CardTitle>Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No categories found. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category: Category) => (
                <div key={category.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">📂 {category.name}</h3>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? '✅ Active' : '❌ Inactive'}
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-gray-600 mb-2">{category.description}</p>
                    )}
                    <p className="text-sm text-gray-400">
                      Created: {category.created_at.toLocaleDateString()} | Updated: {category.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
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
                            This will permanently delete the category "{category.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id)}>
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