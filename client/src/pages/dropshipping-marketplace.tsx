import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Filter, Plus, Star, Package, DollarSign, TrendingUp, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface DropshippingProduct {
  id: number;
  partnerId: number;
  name: string;
  description: string;
  category: string;
  wholesalePrice: string;
  suggestedRetailPrice: string;
  minimumPrice: string;
  currency: string;
  images: string[];
  stock: number;
  commissionRate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  partner: {
    id: number;
    companyName: string;
    businessType: string;
  };
}

interface MarketplaceResponse {
  products: DropshippingProduct[];
  pagination: {
    currentPage: number;
    totalProducts: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface AddProductForm {
  dropshippingProductId: number;
  sellingPrice: string;
  customName: string;
  customDescription: string;
}

export default function DropshippingMarketplace() {
  const { user: creator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<DropshippingProduct | null>(null);
  const [addProductForm, setAddProductForm] = useState<AddProductForm>({
    dropshippingProductId: 0,
    sellingPrice: "",
    customName: "",
    customDescription: "",
  });

  const { data: marketplaceData, isLoading } = useQuery({
    queryKey: ["/api/dropshipping/marketplace", { search: searchTerm, category: selectedCategory }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      
      const response = await apiRequest("GET", `/api/dropshipping/marketplace?${params}`);
      const data = await response.json() as MarketplaceResponse;
      return data;
    },
  });

  const products = marketplaceData?.products || [];
  const pagination = marketplaceData?.pagination;

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/dropshipping/partners"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dropshipping/partners");
      return response.json();
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: AddProductForm) => {
      if (!creator?.id) throw new Error("Creator not found");
      const response = await apiRequest("POST", `/api/creators/${creator.id}/dropshipping/add-product`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Product has been added to your store successfully.",
      });
      setSelectedProduct(null);
      setAddProductForm({
        dropshippingProductId: 0,
        sellingPrice: "",
        customName: "",
        customDescription: "",
      });
      if (creator?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator.id}/dropshipping/products`] });
        queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator.id}/products`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to store.",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const form = {
      ...addProductForm,
      dropshippingProductId: selectedProduct.id,
    };
    
    addProductMutation.mutate(form);
  };

  const calculateProfit = () => {
    if (!selectedProduct || !addProductForm.sellingPrice) return 0;
    const sellingPrice = parseFloat(addProductForm.sellingPrice);
    const wholesalePrice = parseFloat(selectedProduct.wholesalePrice);
    return Math.max(0, sellingPrice - wholesalePrice);
  };

  const calculateCommission = () => {
    if (!selectedProduct) return 0;
    const profit = calculateProfit();
    const commissionRate = parseFloat(selectedProduct.commissionRate) / 100;
    return profit * commissionRate;
  };

  const categories = products.reduce((acc: string[], product: DropshippingProduct) => {
    if (!acc.includes(product.category)) {
      acc.push(product.category);
    }
    return acc;
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dropshipping Marketplace</h1>
        <p className="text-gray-600">
          Browse products from verified suppliers and add them to your store without handling inventory.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Partners</p>
                <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Become a Supplier</p>
                  <p className="text-sm text-gray-500">Join our marketplace</p>
                </div>
              </div>
              <Link href="/supplier-registration">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Apply Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Partnership CTA Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Are you a supplier?</h3>
            <p className="text-blue-100">
              Join our verified supplier network and reach thousands of creators across Africa. 
              Earn competitive commissions on every sale.
            </p>
          </div>
          <Link href="/supplier-registration">
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Plus className="h-4 w-4 mr-2" />
              Become a Supplier
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={product.images[0] || "/placeholder-product.png"}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-2 right-2 bg-green-600">
                  {product.commissionRate}% Commission
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium">{product.partner.companyName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {product.partner.businessType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Wholesale:</span>
                    <span className="font-medium">{product.currency} {product.wholesalePrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Suggested:</span>
                    <span className="font-medium text-green-600">{product.currency} {product.suggestedRetailPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium">{product.stock} units</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Store
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mb-8">
          <Button
            variant="outline"
            disabled={!pagination.hasPrev}
            onClick={() => {
              // Add pagination logic here when needed
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNext}
            onClick={() => {
              // Add pagination logic here when needed
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product to Store</DialogTitle>
            <DialogDescription>
              Configure how this product will appear in your store.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={selectedProduct.images[0] || "/placeholder-product.png"}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <h4 className="font-medium">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    Wholesale: {selectedProduct.currency} {selectedProduct.wholesalePrice}
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="selling-price">Your Selling Price *</Label>
                <Input
                  id="selling-price"
                  type="number"
                  step="0.01"
                  min={selectedProduct.minimumPrice}
                  placeholder={`Min: ${selectedProduct.currency} ${selectedProduct.minimumPrice}`}
                  value={addProductForm.sellingPrice}
                  onChange={(e) => setAddProductForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum price: {selectedProduct.currency} {selectedProduct.minimumPrice}
                </p>
              </div>

              <div>
                <Label htmlFor="custom-name">Custom Product Name (optional)</Label>
                <Input
                  id="custom-name"
                  placeholder={selectedProduct.name}
                  value={addProductForm.customName}
                  onChange={(e) => setAddProductForm(prev => ({ ...prev, customName: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="custom-description">Custom Description (optional)</Label>
                <Textarea
                  id="custom-description"
                  placeholder={selectedProduct.description}
                  value={addProductForm.customDescription}
                  onChange={(e) => setAddProductForm(prev => ({ ...prev, customDescription: e.target.value }))}
                />
              </div>

              {addProductForm.sellingPrice && (
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Your profit per sale:</span>
                    <span className="font-medium">
                      {selectedProduct.currency} {calculateProfit().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Commission to supplier:</span>
                    <span className="font-medium text-orange-600">
                      {selectedProduct.currency} {calculateCommission().toFixed(2)} ({selectedProduct.commissionRate}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={!addProductForm.sellingPrice || addProductMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addProductMutation.isPending ? "Adding..." : "Add to Store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}