import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/navbar";
import ProductUpload from "@/components/dashboard/product-upload";
import { useAuth } from "@/contexts/AuthContext";
import { PriceDisplay } from "@/components/ui/price-display";
import { 
  Plus, 
  Package,
  Eye,
  Edit,
  ExternalLink,
  ArrowLeft,
  Search
} from "lucide-react";
import { Link } from "wouter";

export default function Products() {
  const { creator: activeCreator } = useAuth();
  const [activeTab, setActiveTab] = useState("list");

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: [`/api/creators/${activeCreator?.id}/products`],
    enabled: !!activeCreator?.id,
  });

  if (!activeCreator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Creator Profile</h1>
            <p className="text-gray-600 mb-8">You need to create a creator profile to manage products</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600">Manage your digital products, services, and merchandise</p>
            </div>
          </div>
          <Button onClick={() => setActiveTab("create")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">Product List</TabsTrigger>
            <TabsTrigger value="create">Add Product</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>
                  {Array.isArray(products) ? products.length : 0} products available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse border rounded-lg p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(products) && products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((product: any) => (
                      <div key={product.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                            <p className="text-gray-600 mb-3">{product.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="capitalize px-2 py-1 bg-gray-100 rounded-md">{product.type}</span>
                              <span>Created {new Date(product.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right ml-6">
                            <p className="font-bold text-2xl mb-2">
                              <PriceDisplay amount={parseFloat(product.price)} />
                            </p>
                            <Badge variant={product.isActive ? 'default' : 'secondary'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{product.views || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{product.downloads || 0} sales</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Store
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-6">Start selling by creating your first product</p>
                    <Button onClick={() => setActiveTab("create")} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <ProductUpload onSuccess={() => setActiveTab("list")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}