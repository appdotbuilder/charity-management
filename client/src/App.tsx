import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from '@/components/UserManagement';
import { CategoryManagement } from '@/components/CategoryManagement';
import { ProductManagement } from '@/components/ProductManagement';
import { OrderManagement } from '@/components/OrderManagement';
import { OrderItemManagement } from '@/components/OrderItemManagement';

function App() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏪 Business Management System</h1>
          <p className="text-lg text-gray-600">Complete CRUD operations for all your business entities</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Data Management</CardTitle>
            <CardDescription>
              Create, read, update, and delete records across all tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  👥 Users
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  📂 Categories
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
                  📦 Products
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  📋 Orders
                </TabsTrigger>
                <TabsTrigger value="order-items" className="flex items-center gap-2">
                  📝 Order Items
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-6">
                <UserManagement />
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <CategoryManagement />
              </TabsContent>

              <TabsContent value="products" className="mt-6">
                <ProductManagement />
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <OrderManagement />
              </TabsContent>

              <TabsContent value="order-items" className="mt-6">
                <OrderItemManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;