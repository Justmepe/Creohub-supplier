import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import {
  Upload,
  Package,
  Download,
  Calendar,
  Clock,
  Image,
  FileText,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  Save,
  X
} from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  currency: z.string().default("KES"),
  type: z.enum(["digital", "physical", "service", "booking"]),
  category: z.string().optional(),
  stock: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductUploadProps {
  onSuccess?: () => void;
  editProduct?: any;
}

export default function ProductUpload({ onSuccess, editProduct }: ProductUploadProps) {
  const { creator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: editProduct?.name || "",
      description: editProduct?.description || "",
      price: editProduct?.price || "",
      currency: editProduct?.currency || "KES",
      type: editProduct?.type || "digital",
      category: editProduct?.category || "",
      stock: editProduct?.stock?.toString() || "",
      isActive: editProduct?.isActive ?? true,
    },
  });

  const productType = form.watch("type");

  const createProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      setIsUploading(true);
      setUploadProgress(20);
      
      const response = await fetch("/api/products", {
        method: "POST",
        body: data,
      });
      
      setUploadProgress(100);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}/products`] });
      toast({
        title: "Product created successfully!",
        description: "Your product has been added to your store.",
      });
      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating product",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/products/${editProduct.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creator?.id}/products`] });
      toast({
        title: "Product updated successfully!",
        description: "Your changes have been saved.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (!creator) return;

    if (editProduct) {
      // Update existing product
      const updateData = {
        ...data,
        price: parseFloat(data.price),
        stock: data.stock ? parseInt(data.stock) : null,
        creatorId: creator.id,
      };
      updateProductMutation.mutate(updateData);
    } else {
      // Create new product
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("price", data.price);
      formData.append("currency", data.currency);
      formData.append("type", data.type);
      formData.append("category", data.category || "");
      formData.append("stock", data.stock || "");
      formData.append("isActive", data.isActive.toString());
      formData.append("creatorId", creator.id.toString());

      if (selectedFile) {
        formData.append("digitalFile", selectedFile);
      }

      createProductMutation.mutate(formData);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(10);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case "digital": return <Download className="h-4 w-4" />;
      case "service": return <Calendar className="h-4 w-4" />;
      case "booking": return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getProductTypeDescription = (type: string) => {
    switch (type) {
      case "digital": return "Downloadable files like ebooks, courses, software";
      case "physical": return "Items that need to be shipped to customers";
      case "service": return "Professional services or consultations";
      case "booking": return "Time-based appointments or sessions";
      default: return "";
    }
  };

  const categories = [
    "Education", "Technology", "Design", "Business", "Marketing", 
    "Health & Fitness", "Art & Creativity", "Music", "Photography",
    "Fashion", "Food & Cooking", "Travel", "Lifestyle", "Other"
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {editProduct ? "Edit Product" : "Add New Product"}
        </h2>
        <p className="text-gray-600">
          {editProduct ? "Update your product details" : "Upload your digital products, services, or merchandise"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Type
              </CardTitle>
              <CardDescription>
                Choose the type of product you're selling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["digital", "physical", "service", "booking"].map((type) => (
                        <div
                          key={type}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            field.value === type 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => field.onChange(type)}
                        >
                          <div className="text-center">
                            <div className="mb-2 flex justify-center">
                              {getProductTypeIcon(type)}
                            </div>
                            <h4 className="font-semibold capitalize">{type}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {getProductTypeDescription(type)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your product..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Help customers understand what they're buying
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Product Status</FormLabel>
                        <FormDescription>
                          Make this product visible to customers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          {field.value ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            KES
                          </span>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            className="pl-12"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {productType === "physical" && (
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter quantity"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited stock
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Upload for Digital Products */}
          {productType === "digital" && !editProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Digital File
                </CardTitle>
                <CardDescription>
                  Upload the file customers will download after purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, ZIP, MP4, or other digital files (max 500MB)
                    </p>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.zip,.mp4,.mp3,.epub,.docx,.pptx"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-3">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-sm text-gray-500 mt-1">
                          Preparing upload... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={createProductMutation.isPending || updateProductMutation.isPending || isUploading}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {createProductMutation.isPending || updateProductMutation.isPending || isUploading
                ? (editProduct ? "Updating..." : "Creating...")
                : (editProduct ? "Update Product" : "Create Product")
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
