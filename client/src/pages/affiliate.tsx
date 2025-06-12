import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ExternalLink, TrendingUp, DollarSign, Users, MousePointer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Product, AffiliateLink, Commission } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function AffiliatePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { creator } = useAuth();
  const { formatPrice, convertPrice } = useCurrency();
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch user's products for affiliate link creation
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/creators/${creator?.id}/products`],
    enabled: !!creator?.id,
  });

  // Fetch existing affiliate links
  const { data: affiliateLinks = [], isLoading: linksLoading, refetch: refetchLinks } = useQuery<AffiliateLink[]>({
    queryKey: ["/api/affiliate/links"],
    staleTime: 0,
  });

  // Fetch commissions
  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/affiliate/commissions"],
  });

  // Create affiliate link mutation
  const createAffiliateLinkMutation = useMutation({
    mutationFn: async (data: { productId: number; commissionRate: string }) => {
      return apiRequest("POST", "/api/affiliate/links", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Affiliate link created successfully",
      });
      setSelectedProduct(null);
      formRef.current?.reset();
      refetchLinks();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create affiliate link",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  const handleCreateAffiliateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const commissionRate = formData.get("commissionRate") as string;

    createAffiliateLinkMutation.mutate({
      productId: selectedProduct,
      commissionRate,
    });
  };

  // Calculate total earnings
  const totalEarnings = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + parseFloat(c.commissionAmount || "0"), 0);

  const pendingEarnings = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + parseFloat(c.commissionAmount || "0"), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Affiliate Program</h1>
        <p className="text-muted-foreground">
          Promote other creators' products and earn commissions
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">My Links</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="create">Create Link</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(totalEarnings, 'KES')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(pendingEarnings, 'KES')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Links</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{affiliateLinks.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {affiliateLinks.reduce((sum, link) => sum + (link.clicks || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>My Affiliate Links</CardTitle>
              <CardDescription>
                Manage your affiliate links and track their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliateLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">Product #{link.productId}</div>
                      <div className="text-sm text-muted-foreground">
                        Commission: {link.commissionRate}% | Clicks: {link.clicks || 0} | Conversions: {link.conversions || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Code: {link.linkCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={link.isActive ? "default" : "secondary"}>
                        {link.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${window.location.origin}/product/${link.productId}?ref=${link.linkCode}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {affiliateLinks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No affiliate links created yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>
                Track your commission earnings and payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{formatPrice(parseFloat(commission.commissionAmount), 'KES')}</div>
                      <div className="text-sm text-muted-foreground">
                        Order #{commission.orderId} • {new Date(commission.createdAt || new Date()).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={commission.status === "paid" ? "default" : "secondary"}>
                      {commission.status}
                    </Badge>
                  </div>
                ))}
                {commissions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No commissions earned yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Affiliate Link</CardTitle>
              <CardDescription>
                Generate a new affiliate link for a product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="ml-2">Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products available to create affiliate links.</p>
                  <p className="text-sm text-muted-foreground mt-2">Create some products first in the Products tab.</p>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleCreateAffiliateLink} className="space-y-4">
                  <div>
                    <Label htmlFor="product">Product ({products.length} available)</Label>
                    <Select onValueChange={(value) => setSelectedProduct(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - {formatPrice(parseFloat(product.price), 'KES')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      name="commissionRate"
                      type="number"
                      min="1"
                      max="50"
                      step="0.1"
                      placeholder="15"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createAffiliateLinkMutation.isPending}
                    className="w-full"
                  >
                    {createAffiliateLinkMutation.isPending ? "Creating..." : "Create Affiliate Link"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}