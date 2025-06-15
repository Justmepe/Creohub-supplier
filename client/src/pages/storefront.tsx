import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProductCard from "@/components/storefront/product-card";
import CartDrawer from "@/components/cart/cart-drawer";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/queryClient";
import { 
  Globe, 
  Mail, 
  MapPin, 
  Star, 
  ShoppingCart,
  ExternalLink,
  Eye,
  Heart,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function Storefront() {
  const { handle } = useParams();

  const { data: creator, isLoading: creatorLoading, error: creatorError } = useQuery({
    queryKey: [`/api/creators/${handle}`],
    enabled: !!handle,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/creators/${handle}`);
      return response.json();
    }
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: [`/api/creators/${creator?.id}/products`],
    enabled: !!creator?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/creators/${creator?.id}/products`);
      return response.json();
    }
  });

  // Track storefront view
  useEffect(() => {
    if (creator?.id) {
      apiRequest("POST", "/api/analytics", {
        creatorId: creator.id,
        eventType: "view",
        eventData: { page: "storefront" },
      }).catch(console.error);
    }
  }, [creator?.id]);

  if (creatorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (creatorError || !creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h3>
            <p className="text-gray-600 mb-4">
              The store you're looking for doesn't exist or may have been moved.
            </p>
            <Button asChild>
              <Link href="/">
                <Globe className="mr-2 h-4 w-4" />
                Explore Creohub
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProducts = products?.filter((product: any) => product.isActive) || [];
  const digitalProducts = activeProducts.filter((product: any) => product.type === 'digital');
  const physicalProducts = activeProducts.filter((product: any) => product.type === 'physical');
  const services = activeProducts.filter((product: any) => product.type === 'service');

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
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Store Header */}
      <div className={`py-16 ${getThemeClasses(creator.storeTheme)}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold">
                  {creator.storeName.charAt(0)}
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {creator.storeName}
              </h1>
              {creator.storeDescription && (
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  {creator.storeDescription}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Eye className="mr-1 h-3 w-3" />
                Store
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <ShoppingCart className="mr-1 h-3 w-3" />
                {activeProducts.length} Products
              </Badge>
              {creator.planType === 'pro' && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Star className="mr-1 h-3 w-3" />
                  Pro Creator
                </Badge>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <CartDrawer creatorId={creator.id} trigger={
                <Button 
                  variant="secondary" 
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Cart
                </Button>
              } />
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                <Heart className="mr-2 h-4 w-4" />
                Follow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeProducts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-6">
                This creator is still setting up their store. Check back soon!
              </p>
              <Button asChild>
                <Link href="/">
                  <Globe className="mr-2 h-4 w-4" />
                  Explore Other Stores
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {/* Digital Products */}
            {digitalProducts.length > 0 && (
              <section>
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Digital Products</h2>
                  <Separator className="ml-4 flex-1" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {digitalProducts.map((product: any) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      creatorId={creator.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Physical Products */}
            {physicalProducts.length > 0 && (
              <section>
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Physical Products</h2>
                  <Separator className="ml-4 flex-1" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {physicalProducts.map((product: any) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      creatorId={creator.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section>
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Services</h2>
                  <Separator className="ml-4 flex-1" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((product: any) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      creatorId={creator.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-600">
                Powered by <Link href="/" className="text-primary font-semibold hover:underline">Creohub</Link>
              </p>
              <p className="text-sm text-gray-500">
                Supporting African creators worldwide
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Create Your Store
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}