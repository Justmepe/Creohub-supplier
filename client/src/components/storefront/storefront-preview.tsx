import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductCard from "./product-card";
import { 
  Store, 
  Eye, 
  Star, 
  MapPin, 
  Calendar,
  ExternalLink,
  Package,
  TrendingUp,
  Users
} from "lucide-react";
import { Link } from "wouter";

interface StorefrontPreviewProps {
  creator: any;
  products: any[];
  analytics?: any[];
  className?: string;
}

export default function StorefrontPreview({ 
  creator, 
  products, 
  analytics = [], 
  className 
}: StorefrontPreviewProps) {
  
  const activeProducts = products.filter(product => product.isActive);
  const viewsCount = analytics.filter(event => event.eventType === 'view').length;
  
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'bold':
        return 'bg-gradient-to-br from-red-500 to-pink-600 text-white';
      case 'creative':
        return 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white';
      case 'professional':
        return 'bg-gradient-to-br from-blue-600 to-blue-800 text-white';
      default:
        return 'bg-gradient-to-br from-primary to-accent text-white';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Store Header Preview */}
      <Card className="overflow-hidden">
        <div className={`p-6 ${getThemeClasses(creator.storeTheme)}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{creator.storeName}</h2>
              {creator.storeDescription && (
                <p className="opacity-90">{creator.storeDescription}</p>
              )}
            </div>
            <Button variant="secondary" asChild className="bg-white text-gray-900 hover:bg-gray-100">
              <Link href={`/storefront/${creator.storeHandle}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Live
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-white/20 text-white border-white/30">
              <Store className="mr-1 h-3 w-3" />
              {activeProducts.length} Products
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              <Eye className="mr-1 h-3 w-3" />
              {viewsCount} Views
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              <Calendar className="mr-1 h-3 w-3" />
              Since {new Date(creator.createdAt).getFullYear()}
            </Badge>
            {creator.planType === 'pro' && (
              <Badge className="bg-white/20 text-white border-white/30">
                <Star className="mr-1 h-3 w-3" />
                Pro Creator
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Store Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{activeProducts.length}</div>
            <div className="text-sm text-gray-600">Active Products</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{viewsCount}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              {creator.planType === 'pro' ? 'Pro' : 'Free'}
            </div>
            <div className="text-sm text-gray-600">Plan Type</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">
              {creator.storeTheme}
            </div>
            <div className="text-sm text-gray-600 capitalize">Theme</div>
          </CardContent>
        </Card>
      </div>

      {/* Products Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Store Products</CardTitle>
              <CardDescription>
                Preview how your products appear to customers
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/products">
                Manage Products
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProducts.slice(0, 6).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  creatorId={creator.id}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-600 mb-4">
                Add products to see how they'll appear in your store
              </p>
              <Button asChild>
                <Link href="/products">
                  Add Your First Product
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store URL */}
      <Card>
        <CardHeader>
          <CardTitle>Store URL</CardTitle>
          <CardDescription>
            Share this link with your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
              <code className="text-sm">
                https://creohub.com/storefront/{creator.storeHandle}
              </code>
            </div>
            <Button variant="outline" onClick={() => {
              navigator.clipboard.writeText(`https://creohub.com/storefront/${creator.storeHandle}`);
            }}>
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
