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
  partner: {
    id: number;
    companyName: string;
    logo: string;
  };
}

interface AddProductForm {
  dropshippingProductId: number;
  sellingPrice: string;
  customName: string;
  customDescription: string;
}

export default function DropshippingMarketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { creator } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<DropshippingProduct | null>(null);
  const [addProductForm, setAddProductForm] = useState<AddProductForm>({
    dropshippingProductId: 0,
    sellingPrice: "",
    customName: "",
    customDescription: "",
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/dropshipping/marketplace", { search: searchTerm, category: selectedCategory }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      
      const response = await apiRequest("GET", `/api/dropshipping/marketplace?${params}`);
      return response.json();
    },
  });

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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to your store.",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = (product: DropshippingProduct) => {
    setSelectedProduct(product);
    setAddProductForm({
      dropshippingProductId: product.id,
      sellingPrice: product.suggestedRetailPrice,
      customName: product.name,
      customDescription: product.description,
    });
  };

  const calculateProfit = () => {
    if (!selectedProduct || !addProductForm.sellingPrice) return 0;
    const sellingPrice = parseFloat(addProductForm.sellingPrice);
    const wholesalePrice = parseFloat(selectedProduct.wholesalePrice);
    return sellingPrice - wholesalePrice;
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
                <p className="text-sm font-medium text-gray-600">Verified Partners</p>
                <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Commission</p>
                <p className="text-2xl font-bold text-gray-900">15%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: DropshippingProduct) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={product.images[0] || "/placeholder-product.jpg"}
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
                <div className="flex items-center mb-2">
                  <img
                    src={product.partner.logo || "/placeholder-logo.png"}
                    alt={product.partner.companyName}
                    className="w-6 h-6 rounded mr-2"
                  />
                  <span className="text-sm text-gray-600">{product.partner.companyName}</span>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddProduct(product)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Store
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Product to Your Store</DialogTitle>
                      <DialogDescription>
                        Customize the product details for your store
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customName">Product Name</Label>
                        <Input
                          id="customName"
                          value={addProductForm.customName}
                          onChange={(e) => setAddProductForm(prev => ({ 
                            ...prev, 
                            customName: e.target.value 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customDescription">Description</Label>
                        <Textarea
                          id="customDescription"
                          value={addProductForm.customDescription}
                          onChange={(e) => setAddProductForm(prev => ({ 
                            ...prev, 
                            customDescription: e.target.value 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sellingPrice">Your Selling Price ({selectedProduct?.currency})</Label>
                        <Input
                          id="sellingPrice"
                          type="number"
                          step="0.01"
                          value={addProductForm.sellingPrice}
                          onChange={(e) => setAddProductForm(prev => ({ 
                            ...prev, 
                            sellingPrice: e.target.value 
                          }))}
                        />
                        {selectedProduct && (
                          <p className="text-xs text-gray-500 mt-1">
                            Minimum: {selectedProduct.currency} {selectedProduct.minimumPrice}
                          </p>
                        )}
                      </div>
                      {selectedProduct && addProductForm.sellingPrice && (
                        <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Your Profit:</span>
                            <span className="font-medium text-green-600">
                              {selectedProduct.currency} {calculateProfit().toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Your Commission:</span>
                            <span className="font-medium text-blue-600">
                              {selectedProduct.currency} {calculateCommission().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={() => addProductMutation.mutate(addProductForm)}
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? "Adding..." : "Add Product"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {products.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}