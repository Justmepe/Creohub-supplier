import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/layout/navbar";
import ProductUpload from "@/components/dashboard/product-upload";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Download,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Products() {
  const { creator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: products, isLoading, error } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/products`],
    enabled: !!creator?.id,
  });

  // Debug products query
  console.log('Products page debug (AFTER FIX):', {
    creator: creator,
    creatorId: creator?.id,
    queryEnabled: !!creator?.id,
    products: products,
    productsType: typeof products,
    isArray: Array.isArray(products),
    productsLength: products?.length,
    isLoading: isLoading,
    error: error,
    errorMessage: error?.message,
    queryKey: `/api/creators/${creator?.id}/products`
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest("DELETE", `/api/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}/products`] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleProductStatus = useMutation({
    mutationFn: ({ productId, isActive }: { productId: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/products/${productId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}/products`] });
      toast({
        title: "Product updated",
        description: "Product status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Creator Profile Required</h3>
              <p className="text-gray-600 mb-4">You need to create a creator profile to manage products.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredProducts = products?.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || product.type === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  const productTypes = [
    { value: "all", label: "All Products" },
    { value: "digital", label: "Digital" },
    { value: "physical", label: "Physical" },
    { value: "service", label: "Services" },
    { value: "booking", label: "Bookings" },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "digital": return "bg-blue-100 text-blue-800";
      case "physical": return "bg-green-100 text-green-800";
      case "service": return "bg-purple-100 text-purple-800";
      case "booking": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: string, currency: string = "KES") => {
    return `${currency} ${parseFloat(price).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
              <p className="text-gray-600">
                Manage your digital products, physical goods, and services
              </p>
            </div>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Upload a new product to your store
                  </DialogDescription>
                </DialogHeader>
                <ProductUpload onSuccess={() => setShowUploadDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {productTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || selectedType !== "all" ? "No products found" : "No products yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedType !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first product to your store"
                }
              </p>
              {(!searchQuery && selectedType === "all") && (
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Product
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  {/* Product Image/Icon */}
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleProductStatus.mutate({
                              productId: product.id,
                              isActive: !product.isActive
                            })}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {product.isActive ? "Hide" : "Show"} Product
                          </DropdownMenuItem>
                          {product.digitalFile && (
                            <DropdownMenuItem asChild>
                              <a href={product.digitalFile} download>
                                <Download className="mr-2 h-4 w-4" />
                                Download File
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProductMutation.mutate(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {product.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        {product.type === "physical" && product.stock !== null && (
                          <span className="text-xs text-gray-500">
                            {product.stock} in stock
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getTypeColor(product.type)}>
                          {product.type}
                        </Badge>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </div>
                    </div>

                    {product.category && (
                      <Badge variant="outline" className="w-fit">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {products && products.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {products.filter((p: any) => p.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {products.filter((p: any) => p.type === "digital").length}
                </div>
                <div className="text-sm text-gray-600">Digital</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {products.filter((p: any) => p.type === "physical").length}
                </div>
                <div className="text-sm text-gray-600">Physical</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
