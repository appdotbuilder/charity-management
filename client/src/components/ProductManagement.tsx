import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Product, CreateProductInput, UpdateProductInput, Category } from '../../../server/src/schema';

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    description: null,
    price: 0,
    stock_quantity: 0,
    category_id: null,
    is_active: true
  });

  const loadProducts = useCallback(async () => {
    try {
      const result = await trpc.products.getAll.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.categories.getAll.query();
      setCategories(result.filter((cat: Category) => cat.is_active));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingProduct) {
        // Update existing product
        const updateData: UpdateProductInput = {
          id: editingProduct.id,
          ...formData
        };
        const updatedProduct = await trpc.products.update.mutate(updateData);
        setProducts((prev: Product[]) => prev.map((p: Product) => p.id === updatedProduct.id ? updatedProduct : p));
        setEditingProduct(null);
      } else {
        // Create new product
        const newProduct = await trpc.products.create.mutate(formData);
        setProducts((prev: Product[]) => [...prev, newProduct]);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: null,
        price: 0,
        stock_quantity: 0,
        category_id: null,
        is_active: true
      });
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      is_active: product.is_active
    });
  };

  const handleDelete = async (productId: number) => {
    try {
      await trpc.products.delete.mutate({ id: productId });
      setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: null,
      price: 0,
      stock_quantity: 0,
      category_id: null,
      is_active: true
    });
  };

  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingProduct ? 'Edit Product' : 'Create New Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateProductInput) => ({
                      ...prev,
                      category_id: value === 'none' ? null : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateProductInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                  }
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  placeholder="0"
                  value={formData.stock_quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Active Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active" className="text-sm">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
              {editingProduct && (
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
          <CardTitle>Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No products found. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {products.map((product: Product) => (
                <div key={product.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">📦 {product.name}</h3>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? '✅ Active' : '❌ Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        📂 {getCategoryName(product.category_id)}
                      </Badge>
                    </div>
                    
                    {product.description && (
                      <p className="text-gray-600 mb-2">{product.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-lg font-semibold text-green-600">
                        💰 ${product.price.toFixed(2)}
                      </span>
                      <span className={`text-sm ${product.stock_quantity > 10 ? 'text-green-600' : product.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        📦 Stock: {product.stock_quantity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      Created: {product.created_at.toLocaleDateString()} | Updated: {product.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
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
                            This will permanently delete the product "{product.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product.id)}>
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