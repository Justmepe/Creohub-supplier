import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Upload, Download, RefreshCw, Package, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  wholesalePrice: z.string().min(1, "Wholesale price is required"),
  suggestedRetailPrice: z.string().min(1, "Suggested retail price is required"),
  minimumPrice: z.string().min(1, "Minimum price is required"),
  currency: z.string().default("KES"),
  stock: z.number().min(0, "Stock must be 0 or greater"),
  commissionRate: z.string().min(1, "Commission rate is required"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function SupplierDashboard() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock partner ID - in real app, get from auth context
  const partnerId = 1;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      wholesalePrice: "",
      suggestedRetailPrice: "",
      minimumPrice: "",
      currency: "KES",
      stock: 0,
      commissionRate: "15.00",
    },
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: [`/api/dropshipping/partners/${partnerId}/products`],
  });

  // Fetch sync logs
  const { data: syncLogs = [], isLoading: logsLoading } = useQuery<any[]>({
    queryKey: [`/api/dropshipping/partners/${partnerId}/sync-logs`],
  });

  // Add manual product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/dropshipping/products", {
        ...data,
        partnerId,
        importSource: "manual",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Product has been successfully added to your catalog.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/dropshipping/partners/${partnerId}/products`] });
      setIsAddProductOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  // Sync products mutation
  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/dropshipping/partners/${partnerId}/sync`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Synced ${data.successCount} products successfully. ${data.newProducts} new, ${data.updatedProducts} updated.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/dropshipping/partners/${partnerId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/dropshipping/partners/${partnerId}/sync-logs`] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync products",
        variant: "destructive",
      });
    },
  });

  // CSV import mutation
  const csvImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("csv", file);
      const response = await fetch(`/api/dropshipping/partners/${partnerId}/csv-import`, {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CSV Import Complete",
        description: `Imported ${data.successCount} products successfully. ${data.newProducts} new, ${data.updatedProducts} updated.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/dropshipping/partners/${partnerId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/dropshipping/partners/${partnerId}/sync-logs`] });
      setCsvFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    addProductMutation.mutate(data);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
  };

  const handleCsvImport = () => {
    if (csvFile) {
      csvImportMutation.mutate(csvFile);
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "in_progress":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
          <p className="text-muted-foreground">Manage your product catalog and sync operations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => syncProductsMutation.mutate()}
            disabled={syncProductsMutation.isPending}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {syncProductsMutation.isPending ? "Syncing..." : "Sync Products"}
          </Button>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Manually add a new product to your catalog
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter product name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Electronics" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Detailed product description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="wholesalePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wholesale Price (KES)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="suggestedRetailPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suggested Retail Price (KES)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="minimumPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Price (KES)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="0"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="commissionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Rate (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="15.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addProductMutation.isPending}>
                      {addProductMutation.isPending ? "Adding..." : "Add Product"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Catalog ({products.length})
              </CardTitle>
              <CardDescription>
                Manage your dropshipping product catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products found. Add your first product to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product: any) => (
                    <Card key={product.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <Badge variant={product.importSource === "manual" ? "outline" : "secondary"}>
                            {product.importSource === "manual" ? "Manual" : "Auto"}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span>{product.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Wholesale:</span>
                            <span>KES {parseFloat(product.wholesalePrice).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Retail:</span>
                            <span>KES {parseFloat(product.suggestedRetailPrice).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stock:</span>
                            <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                              {product.stock} units
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission:</span>
                            <span>{product.commissionRate}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Import Products
              </CardTitle>
              <CardDescription>
                Import multiple products using CSV file upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a CSV file containing your product data
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                      />
                      <Button variant="outline" className="w-full">
                        Choose CSV File
                      </Button>
                    </Label>
                    {csvFile && (
                      <div className="text-sm text-green-600">
                        Selected: {csvFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {csvFile && (
                <div className="flex justify-center">
                  <Button 
                    onClick={handleCsvImport}
                    disabled={csvImportMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {csvImportMutation.isPending ? "Importing..." : "Import Products"}
                  </Button>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>name, description, category, price, stock columns are required</li>
                  <li>Use UTF-8 encoding for special characters</li>
                  <li>Price should be in KES without currency symbols</li>
                  <li>Stock should be numeric values only</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Sync History
              </CardTitle>
              <CardDescription>
                View the history of product synchronization operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">Loading sync logs...</div>
              ) : syncLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sync operations yet. Start by syncing your products.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncLogs.map((log: any) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{log.syncType === "api" ? "API Sync" : "CSV Import"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {getSyncStatusBadge(log.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="ml-2 font-medium">{log.totalProducts}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success:</span>
                          <span className="ml-2 font-medium text-green-600">{log.successCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Errors:</span>
                          <span className="ml-2 font-medium text-red-600">{log.errorCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Skipped:</span>
                          <span className="ml-2 font-medium text-yellow-600">{log.skippedCount}</span>
                        </div>
                      </div>
                      {log.errorDetails && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                          <strong>Errors:</strong> {log.errorDetails}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}