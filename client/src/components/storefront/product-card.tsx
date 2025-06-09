import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PriceDisplay } from "@/components/ui/price-display";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  ShoppingCart,
  Package,
  Download,
  Calendar,
  Clock,
  Eye,
  Star,
  Heart,
  Share2
} from "lucide-react";
import { Link } from "wouter";

interface ProductCardProps {
  product: any;
  creatorId: number;
  variant?: "default" | "compact" | "detailed";
}

export default function ProductCard({ product, creatorId, variant = "default" }: ProductCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const addToCart = async () => {
    setIsAddingToCart(true);
    
    // Track product view
    try {
      await apiRequest("POST", "/api/analytics", {
        creatorId,
        productId: product.id,
        eventType: "click",
        eventData: { action: "add_to_cart" },
      });
    } catch (error) {
      console.error("Failed to track analytics:", error);
    }

    // Add to localStorage cart
    const cartKey = `cart_${creatorId}`;
    const existingCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    
    const existingItem = existingCart.find((item: any) => item.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      existingCart.push({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        type: product.type,
      });
    }
    
    localStorage.setItem(cartKey, JSON.stringify(existingCart));
    
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cart-updated'));
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
    
    setIsAddingToCart(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "digital": return <Download className="h-4 w-4" />;
      case "service": return <Calendar className="h-4 w-4" />;
      case "booking": return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

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

  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {getTypeIcon(product.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{product.name}</h4>
          <PriceDisplay
            originalPrice={parseFloat(product.price)}
            originalCurrency={product.currency}
            size="sm"
          />
        </div>
        <Button size="sm" onClick={addToCart} disabled={isAddingToCart}>
          <ShoppingCart className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Product Image/Preview */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getTypeIcon(product.type)}
            </div>
          )}
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{product.name}</DialogTitle>
                  <DialogDescription>Product Details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {product.images && product.images.length > 0 && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <PriceDisplay
                        originalPrice={parseFloat(product.price)}
                        originalCurrency={product.currency}
                        size="lg"
                      />
                      <Badge className={getTypeColor(product.type)}>
                        {product.type}
                      </Badge>
                    </div>
                    
                    {product.description && (
                      <p className="text-gray-700">{product.description}</p>
                    )}
                    
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                    
                    {product.type === "physical" && product.stock !== null && (
                      <p className="text-sm text-gray-600">
                        {product.stock} items in stock
                      </p>
                    )}
                    
                    <Button onClick={addToCart} disabled={isAddingToCart} className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isAddingToCart ? "Adding..." : "Add to Cart"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button size="sm" variant="secondary">
              <Heart className="h-4 w-4" />
            </Button>
            
            <Button size="sm" variant="secondary">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Product Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge className={getTypeColor(product.type)}>
              {getTypeIcon(product.type)}
              <span className="ml-1 capitalize">{product.type}</span>
            </Badge>
          </div>
          
          {/* Stock Badge for Physical Products */}
          {product.type === "physical" && product.stock !== null && product.stock < 10 && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive">
                Low Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <PriceDisplay
                originalPrice={parseFloat(product.price)}
                originalCurrency={product.currency}
                size="lg"
              />
              {product.type === "physical" && product.stock !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  {product.stock} in stock
                </p>
              )}
            </div>
            
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={addToCart}
              disabled={isAddingToCart}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={async () => {
                // Add to cart first
                await addToCart();
                // Then navigate to checkout using wouter
                setLocation(`/checkout/${creatorId}`);
              }}
              disabled={isAddingToCart}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
