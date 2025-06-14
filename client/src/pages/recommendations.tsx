import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  User, 
  Users, 
  Calendar, 
  Brain, 
  Star, 
  Eye, 
  Plus,
  BarChart3,
  Target,
  Lightbulb,
  Zap
} from "lucide-react";

interface Recommendation {
  id: number;
  type: "dropshipping_product" | "own_product";
  name: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  score: number;
  reason: string;
  metadata: {
    wholesalePrice?: string;
    commissionRate?: string;
    recommendationType: string;
    trendingCategory?: boolean;
    personalizedMatch?: boolean;
    similarCreatorMatch?: boolean;
    seasonalMatch?: boolean;
    season?: string;
  };
  partner?: {
    id: number;
    companyName: string;
    logo: string;
  };
}

interface MarketTrend {
  id: number;
  category: string;
  region: string;
  trendScore: string;
  searchVolume: number;
  salesVelocity: string;
  competitionLevel: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  keywords: string[];
}

interface CreatorPreferences {
  preferredCategories: string[];
  targetAudience: string;
  budgetRange: {
    min: number;
    max: number;
    average: number;
  };
  location: string;
  interests: string[];
  brandStyle: string;
}

const CREATOR_ID = 1; // Mock creator ID

export default function Recommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const { data: recommendations = [], isLoading: loadingRecommendations } = useQuery({
    queryKey: ["/api/creators/1/recommendations", { type: activeTab }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("type", activeTab);
      
      const response = await apiRequest("GET", `/api/creators/1/recommendations?${params}`);
      return response.json();
    },
  });

  const { data: marketTrends = [] } = useQuery({
    queryKey: ["/api/market-trends"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/market-trends");
      return response.json();
    },
  });

  const { data: preferences } = useQuery({
    queryKey: ["/api/creators/1/preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/creators/1/preferences");
      return response.json();
    },
  });

  const trackBehaviorMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/creators/1/recommendations/track`, data);
      return response.json();
    },
  });

  const addToStoreMutation = useMutation({
    mutationFn: async (recommendation: Recommendation) => {
      // Track the action
      await trackBehaviorMutation.mutateAsync({
        action: "add_to_store",
        entityType: "dropshipping_product",
        entityId: recommendation.id,
        metadata: {
          category: recommendation.category,
          recommendationType: recommendation.metadata.recommendationType,
          score: recommendation.score
        }
      });

      const response = await apiRequest("POST", `/api/creators/1/dropshipping/add-product`, {
        dropshippingProductId: recommendation.id,
        sellingPrice: recommendation.price,
        customName: recommendation.name,
        customDescription: recommendation.description
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Product has been added to your store successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/creators/1/dropshipping/products"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to your store.",
        variant: "destructive",
      });
    },
  });

  const handleViewRecommendation = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    
    // Track view behavior
    trackBehaviorMutation.mutate({
      action: "view_product",
      entityType: "dropshipping_product",
      entityId: recommendation.id,
      metadata: {
        category: recommendation.category,
        recommendationType: recommendation.metadata.recommendationType,
        score: recommendation.score
      }
    });
  };

  const handleAddToStore = (recommendation: Recommendation) => {
    addToStoreMutation.mutate(recommendation);
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "trending":
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case "personalized":
        return <User className="h-4 w-4 text-blue-600" />;
      case "similar_creators":
        return <Users className="h-4 w-4 text-green-600" />;
      case "seasonal":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRecommendationTypeLabel = (type: string) => {
    switch (type) {
      case "trending":
        return "Trending";
      case "personalized":
        return "For You";
      case "similar_creators":
        return "Similar Creators";
      case "seasonal":
        return "Seasonal";
      default:
        return "AI Recommended";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50";
    if (score >= 70) return "text-orange-600 bg-orange-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Product Recommendations</h1>
        <p className="text-gray-600">
          Discover products tailored to your audience and market trends using our intelligent recommendation engine.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Recommendations</p>
                <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trending Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {marketTrends.filter((t: MarketTrend) => parseFloat(t.trendScore) > 70).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Match Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recommendations.length > 0 
                    ? Math.round(recommendations.reduce((acc: number, rec: Recommendation) => acc + rec.score, 0) / recommendations.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Lightbulb className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Interests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {preferences?.preferredCategories?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Trends Summary */}
      {marketTrends.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Current Market Trends
            </CardTitle>
            <CardDescription>
              Real-time insights into what's trending in African markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {marketTrends.slice(0, 4).map((trend: MarketTrend) => (
                <div key={trend.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{trend.category}</h4>
                    <Badge variant="outline" className={`${parseFloat(trend.trendScore) > 75 ? 'border-green-500 text-green-700' : 'border-orange-500 text-orange-700'}`}>
                      {Math.round(parseFloat(trend.trendScore))}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {trend.searchVolume.toLocaleString()} searches
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trend.keywords.slice(0, 2).map((keyword, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="personalized">For You</TabsTrigger>
          <TabsTrigger value="similar_creators">Similar</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loadingRecommendations ? (
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
              {recommendations.map((recommendation: Recommendation) => (
                <Card 
                  key={recommendation.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewRecommendation(recommendation)}
                >
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">
                        {recommendation.category === "Electronics" ? "🎧" :
                         recommendation.category === "Beauty & Health" ? "🧴" :
                         recommendation.category === "Fashion & Accessories" ? "👜" : "📦"}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge className={`${getScoreColor(recommendation.score)} border-0`}>
                        <Star className="h-3 w-3 mr-1" />
                        {recommendation.score}%
                      </Badge>
                      <Badge variant="outline" className="bg-white">
                        {getRecommendationIcon(recommendation.metadata.recommendationType)}
                        <span className="ml-1">{getRecommendationTypeLabel(recommendation.metadata.recommendationType)}</span>
                      </Badge>
                    </div>
                    {recommendation.metadata.commissionRate && (
                      <Badge className="absolute top-2 right-2 bg-green-600">
                        {recommendation.metadata.commissionRate}% Commission
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">{recommendation.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{recommendation.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {recommendation.partner && (
                      <div className="flex items-center mb-3">
                        <div className="w-5 h-5 bg-gray-200 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">{recommendation.partner.companyName}</span>
                      </div>
                    )}
                    <div className="space-y-1 mb-3">
                      {recommendation.metadata.wholesalePrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Wholesale:</span>
                          <span className="font-medium">KES {recommendation.metadata.wholesalePrice}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Suggested Price:</span>
                        <span className="font-medium text-green-600">KES {recommendation.price}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                      <Zap className="h-3 w-3 inline mr-1" />
                      {recommendation.reason}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToStore(recommendation);
                      }}
                      disabled={addToStoreMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addToStoreMutation.isPending ? "Adding..." : "Add to Store"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {recommendations.length === 0 && !loadingRecommendations && (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
              <p className="text-gray-600">Check back later for AI-powered product suggestions.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preferences Section */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Preferences
            </CardTitle>
            <CardDescription>
              Preferences help us recommend products that match your audience and style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Preferred Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferredCategories?.map((category: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Target Audience</h4>
                <Badge variant="outline" className="capitalize">
                  {preferences.targetAudience?.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Budget Range</h4>
                <p className="text-sm text-gray-600">
                  KES {preferences.budgetRange?.min?.toLocaleString()} - {preferences.budgetRange?.max?.toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Brand Style</h4>
                <Badge variant="outline" className="capitalize">
                  {preferences.brandStyle?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}