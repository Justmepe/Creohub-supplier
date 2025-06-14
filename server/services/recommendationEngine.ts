import { db } from "../db";
import { 
  creatorPreferences, 
  productRecommendations, 
  marketTrends, 
  creatorBehavior,
  similarCreators,
  products,
  dropshippingProducts,
  dropshippingPartners,
  creators,
  orders,
  analytics
} from "@shared/schema";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";

interface RecommendationRequest {
  creatorId: number;
  limit?: number;
  type?: 'trending' | 'personalized' | 'similar_creators' | 'seasonal' | 'all';
}

interface ProductRecommendation {
  id: number;
  type: 'own_product' | 'dropshipping_product';
  name: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  score: number;
  reason: string;
  metadata: any;
  partner?: {
    id: number;
    companyName: string;
    logo: string;
  };
}

export class IntelligentRecommendationEngine {
  
  // Track creator behavior for learning
  async trackBehavior(
    creatorId: number, 
    action: string, 
    entityType: string, 
    entityId: number, 
    metadata: any = {},
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await db.insert(creatorBehavior).values({
        creatorId,
        action,
        entityType,
        entityId,
        metadata,
        sessionId,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error tracking creator behavior:", error);
    }
  }

  // Get personalized recommendations for a creator
  async getRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    const { creatorId, limit = 20, type = 'all' } = request;
    
    // Get creator preferences
    const preferences = await this.getCreatorPreferences(creatorId);
    
    // Get different types of recommendations based on request
    const recommendations: ProductRecommendation[] = [];
    
    if (type === 'trending' || type === 'all') {
      const trending = await this.getTrendingRecommendations(creatorId, preferences, Math.ceil(limit / 4));
      recommendations.push(...trending);
    }
    
    if (type === 'personalized' || type === 'all') {
      const personalized = await this.getPersonalizedRecommendations(creatorId, preferences, Math.ceil(limit / 4));
      recommendations.push(...personalized);
    }
    
    if (type === 'similar_creators' || type === 'all') {
      const similar = await this.getSimilarCreatorRecommendations(creatorId, preferences, Math.ceil(limit / 4));
      recommendations.push(...similar);
    }
    
    if (type === 'seasonal' || type === 'all') {
      const seasonal = await this.getSeasonalRecommendations(creatorId, preferences, Math.ceil(limit / 4));
      recommendations.push(...seasonal);
    }
    
    // Sort by score and remove duplicates
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    const sortedRecommendations = uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // Store recommendations for tracking
    await this.storeRecommendations(creatorId, sortedRecommendations);
    
    return sortedRecommendations;
  }

  // Get or create creator preferences
  private async getCreatorPreferences(creatorId: number) {
    const [existing] = await db
      .select()
      .from(creatorPreferences)
      .where(eq(creatorPreferences.creatorId, creatorId));
    
    if (existing) {
      return existing;
    }
    
    // Create default preferences based on creator's past behavior
    const defaultPreferences = await this.inferCreatorPreferences(creatorId);
    
    const [newPreferences] = await db
      .insert(creatorPreferences)
      .values({
        creatorId,
        ...defaultPreferences,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newPreferences;
  }

  // Infer preferences from creator's past behavior
  private async inferCreatorPreferences(creatorId: number) {
    // Analyze creator's existing products
    const creatorProducts = await db
      .select()
      .from(products)
      .where(eq(products.creatorId, creatorId));
    
    // Get most common categories
    const categories = creatorProducts.map(p => p.category).filter(Boolean);
    const categoryFreq = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredCategories = Object.keys(categoryFreq)
      .sort((a, b) => categoryFreq[b] - categoryFreq[a])
      .slice(0, 3);
    
    // Analyze price ranges
    const prices = creatorProducts.map(p => parseFloat(p.price)).filter(p => p > 0);
    const budgetRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length
    } : { min: 500, max: 10000, average: 2500 };
    
    return {
      preferredCategories,
      budgetRange,
      targetAudience: "general",
      location: "kenya", // Default, could be inferred from creator profile
      interests: preferredCategories,
      brandStyle: "affordable"
    };
  }

  // Get trending products based on market data
  private async getTrendingRecommendations(
    creatorId: number, 
    preferences: any, 
    limit: number
  ): Promise<ProductRecommendation[]> {
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    // Get trending categories
    const trendingCategories = await db
      .select()
      .from(marketTrends)
      .where(and(
        eq(marketTrends.period, currentMonth),
        gte(marketTrends.trendScore, sql`70`)
      ))
      .orderBy(desc(marketTrends.trendScore))
      .limit(5);
    
    const categoryNames = trendingCategories.map(t => t.category);
    
    // Get dropshipping products in trending categories
    const trendingProducts = await db
      .select({
        id: dropshippingProducts.id,
        name: dropshippingProducts.name,
        description: dropshippingProducts.description,
        wholesalePrice: dropshippingProducts.wholesalePrice,
        suggestedRetailPrice: dropshippingProducts.suggestedRetailPrice,
        images: dropshippingProducts.images,
        category: dropshippingProducts.category,
        commissionRate: dropshippingProducts.commissionRate,
        partner: {
          id: dropshippingPartners.id,
          companyName: dropshippingPartners.companyName,
          logo: dropshippingPartners.logo,
        }
      })
      .from(dropshippingProducts)
      .leftJoin(dropshippingPartners, eq(dropshippingProducts.partnerId, dropshippingPartners.id))
      .where(and(
        inArray(dropshippingProducts.category, categoryNames),
        eq(dropshippingProducts.isActive, true),
        eq(dropshippingPartners.status, "approved")
      ))
      .limit(limit);
    
    return trendingProducts.map(product => ({
      id: product.id,
      type: 'dropshipping_product' as const,
      name: product.name,
      description: product.description || '',
      price: product.suggestedRetailPrice,
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      score: this.calculateTrendingScore(product.category, trendingCategories),
      reason: `Trending in ${product.category} category with ${this.getTrendScore(product.category, trendingCategories)}% market growth`,
      metadata: {
        wholesalePrice: product.wholesalePrice,
        commissionRate: product.commissionRate,
        trendingCategory: true
      },
      partner: product.partner
    }));
  }

  // Get personalized recommendations based on creator's history
  private async getPersonalizedRecommendations(
    creatorId: number, 
    preferences: any, 
    limit: number
  ): Promise<ProductRecommendation[]> {
    
    // Get creator's behavior patterns
    const recentBehavior = await db
      .select()
      .from(creatorBehavior)
      .where(eq(creatorBehavior.creatorId, creatorId))
      .orderBy(desc(creatorBehavior.createdAt))
      .limit(100);
    
    // Analyze viewed categories
    const viewedCategories = recentBehavior
      .filter(b => b.action === 'view_product')
      .map(b => b.metadata?.category)
      .filter(Boolean);
    
    const preferredCategories = preferences.preferredCategories || [];
    const targetCategories = [...new Set([...preferredCategories, ...viewedCategories])];
    
    if (targetCategories.length === 0) {
      return [];
    }
    
    // Get products matching preferences
    const personalizedProducts = await db
      .select({
        id: dropshippingProducts.id,
        name: dropshippingProducts.name,
        description: dropshippingProducts.description,
        wholesalePrice: dropshippingProducts.wholesalePrice,
        suggestedRetailPrice: dropshippingProducts.suggestedRetailPrice,
        images: dropshippingProducts.images,
        category: dropshippingProducts.category,
        commissionRate: dropshippingProducts.commissionRate,
        partner: {
          id: dropshippingPartners.id,
          companyName: dropshippingPartners.companyName,
          logo: dropshippingPartners.logo,
        }
      })
      .from(dropshippingProducts)
      .leftJoin(dropshippingPartners, eq(dropshippingProducts.partnerId, dropshippingPartners.id))
      .where(and(
        inArray(dropshippingProducts.category, targetCategories),
        eq(dropshippingProducts.isActive, true),
        eq(dropshippingPartners.status, "approved")
      ))
      .limit(limit);
    
    return personalizedProducts.map(product => ({
      id: product.id,
      type: 'dropshipping_product' as const,
      name: product.name,
      description: product.description || '',
      price: product.suggestedRetailPrice,
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      score: this.calculatePersonalizedScore(product, preferences, recentBehavior),
      reason: `Matches your interests in ${product.category} and fits your target audience`,
      metadata: {
        wholesalePrice: product.wholesalePrice,
        commissionRate: product.commissionRate,
        personalizedMatch: true
      },
      partner: product.partner
    }));
  }

  // Get recommendations based on similar creators
  private async getSimilarCreatorRecommendations(
    creatorId: number, 
    preferences: any, 
    limit: number
  ): Promise<ProductRecommendation[]> {
    
    // Get similar creators
    const similarCreatorsList = await db
      .select()
      .from(similarCreators)
      .where(eq(similarCreators.creatorId, creatorId))
      .orderBy(desc(similarCreators.similarityScore))
      .limit(5);
    
    if (similarCreatorsList.length === 0) {
      return [];
    }
    
    const similarCreatorIds = similarCreatorsList.map(sc => sc.similarCreatorId);
    
    // Get products that similar creators have added recently
    const similarCreatorProducts = await db
      .select({
        dropshippingProductId: sql`${creatorBehavior.entityId}`,
        count: sql`COUNT(*)`
      })
      .from(creatorBehavior)
      .where(and(
        inArray(creatorBehavior.creatorId, similarCreatorIds),
        eq(creatorBehavior.action, 'add_to_store'),
        eq(creatorBehavior.entityType, 'dropshipping_product')
      ))
      .groupBy(creatorBehavior.entityId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);
    
    const productIds = similarCreatorProducts.map(p => Number(p.dropshippingProductId));
    
    if (productIds.length === 0) {
      return [];
    }
    
    // Get the actual products
    const products = await db
      .select({
        id: dropshippingProducts.id,
        name: dropshippingProducts.name,
        description: dropshippingProducts.description,
        wholesalePrice: dropshippingProducts.wholesalePrice,
        suggestedRetailPrice: dropshippingProducts.suggestedRetailPrice,
        images: dropshippingProducts.images,
        category: dropshippingProducts.category,
        commissionRate: dropshippingProducts.commissionRate,
        partner: {
          id: dropshippingPartners.id,
          companyName: dropshippingPartners.companyName,
          logo: dropshippingPartners.logo,
        }
      })
      .from(dropshippingProducts)
      .leftJoin(dropshippingPartners, eq(dropshippingProducts.partnerId, dropshippingPartners.id))
      .where(and(
        inArray(dropshippingProducts.id, productIds),
        eq(dropshippingProducts.isActive, true),
        eq(dropshippingPartners.status, "approved")
      ));
    
    return products.map(product => ({
      id: product.id,
      type: 'dropshipping_product' as const,
      name: product.name,
      description: product.description || '',
      price: product.suggestedRetailPrice,
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      score: this.calculateSimilarCreatorScore(product.id, similarCreatorProducts),
      reason: `Popular among creators with similar audiences and product preferences`,
      metadata: {
        wholesalePrice: product.wholesalePrice,
        commissionRate: product.commissionRate,
        similarCreatorMatch: true
      },
      partner: product.partner
    }));
  }

  // Get seasonal recommendations
  private async getSeasonalRecommendations(
    creatorId: number, 
    preferences: any, 
    limit: number
  ): Promise<ProductRecommendation[]> {
    const currentMonth = new Date().getMonth() + 1;
    
    // Get seasonal trends
    const seasonalTrends = await db
      .select()
      .from(marketTrends)
      .where(sql`JSON_EXTRACT(seasonality, '$.peak_months') LIKE '%${currentMonth}%'`)
      .orderBy(desc(marketTrends.trendScore))
      .limit(5);
    
    if (seasonalTrends.length === 0) {
      return [];
    }
    
    const seasonalCategories = seasonalTrends.map(t => t.category);
    
    // Get products in seasonal categories
    const seasonalProducts = await db
      .select({
        id: dropshippingProducts.id,
        name: dropshippingProducts.name,
        description: dropshippingProducts.description,
        wholesalePrice: dropshippingProducts.wholesalePrice,
        suggestedRetailPrice: dropshippingProducts.suggestedRetailPrice,
        images: dropshippingProducts.images,
        category: dropshippingProducts.category,
        commissionRate: dropshippingProducts.commissionRate,
        partner: {
          id: dropshippingPartners.id,
          companyName: dropshippingPartners.companyName,
          logo: dropshippingPartners.logo,
        }
      })
      .from(dropshippingProducts)
      .leftJoin(dropshippingPartners, eq(dropshippingProducts.partnerId, dropshippingPartners.id))
      .where(and(
        inArray(dropshippingProducts.category, seasonalCategories),
        eq(dropshippingProducts.isActive, true),
        eq(dropshippingPartners.status, "approved")
      ))
      .limit(limit);
    
    return seasonalProducts.map(product => ({
      id: product.id,
      type: 'dropshipping_product' as const,
      name: product.name,
      description: product.description || '',
      price: product.suggestedRetailPrice,
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      score: this.calculateSeasonalScore(product.category, seasonalTrends, currentMonth),
      reason: `Perfect timing for ${this.getSeasonName(currentMonth)} sales in ${product.category}`,
      metadata: {
        wholesalePrice: product.wholesalePrice,
        commissionRate: product.commissionRate,
        seasonalMatch: true,
        season: this.getSeasonName(currentMonth)
      },
      partner: product.partner
    }));
  }

  // Helper methods for score calculations
  private calculateTrendingScore(category: string, trendingCategories: any[]): number {
    const trend = trendingCategories.find(t => t.category === category);
    return trend ? parseFloat(trend.trendScore) : 60;
  }

  private getTrendScore(category: string, trendingCategories: any[]): number {
    const trend = trendingCategories.find(t => t.category === category);
    return trend ? Math.round(parseFloat(trend.trendScore)) : 60;
  }

  private calculatePersonalizedScore(product: any, preferences: any, behavior: any[]): number {
    let score = 70; // Base score
    
    // Category preference boost
    if (preferences.preferredCategories?.includes(product.category)) {
      score += 15;
    }
    
    // Price range match
    const price = parseFloat(product.suggestedRetailPrice);
    const budgetRange = preferences.budgetRange;
    if (budgetRange && price >= budgetRange.min && price <= budgetRange.max) {
      score += 10;
    }
    
    // Recent behavior boost
    const recentViews = behavior.filter(b => 
      b.action === 'view_product' && 
      b.metadata?.category === product.category
    ).length;
    score += Math.min(recentViews * 2, 10);
    
    return Math.min(score, 95);
  }

  private calculateSimilarCreatorScore(productId: number, similarProducts: any[]): number {
    const productData = similarProducts.find(p => Number(p.dropshippingProductId) === productId);
    const count = productData ? Number(productData.count) : 1;
    return Math.min(60 + (count * 5), 90);
  }

  private calculateSeasonalScore(category: string, seasonalTrends: any[], currentMonth: number): number {
    const trend = seasonalTrends.find(t => t.category === category);
    if (!trend) return 65;
    
    const seasonality = trend.seasonality;
    const peakMonths = seasonality?.peak_months || [];
    
    if (peakMonths.includes(currentMonth)) {
      return Math.min(parseFloat(trend.trendScore) + 20, 95);
    }
    
    return parseFloat(trend.trendScore);
  }

  private getSeasonName(month: number): string {
    if (month >= 12 || month <= 2) return "Holiday Season";
    if (month >= 3 && month <= 5) return "Spring";
    if (month >= 6 && month <= 8) return "Mid-Year";
    return "Back-to-School";
  }

  // Remove duplicate recommendations
  private deduplicateRecommendations(recommendations: ProductRecommendation[]): ProductRecommendation[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = `${rec.type}-${rec.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Store recommendations for tracking
  private async storeRecommendations(creatorId: number, recommendations: ProductRecommendation[]) {
    try {
      // Clear old recommendations
      await db.delete(productRecommendations)
        .where(and(
          eq(productRecommendations.creatorId, creatorId),
          eq(productRecommendations.isActive, true)
        ));
      
      // Insert new recommendations
      const recommendationData = recommendations.map(rec => ({
        creatorId,
        recommendationType: this.inferRecommendationType(rec),
        productType: rec.type,
        productId: rec.type === 'own_product' ? rec.id : null,
        dropshippingProductId: rec.type === 'dropshipping_product' ? rec.id : null,
        score: rec.score.toString(),
        reason: rec.reason,
        metadata: rec.metadata,
        isActive: true,
        createdAt: new Date(),
      }));
      
      await db.insert(productRecommendations).values(recommendationData);
    } catch (error) {
      console.error("Error storing recommendations:", error);
    }
  }

  private inferRecommendationType(rec: ProductRecommendation): string {
    if (rec.metadata?.trendingCategory) return 'trending';
    if (rec.metadata?.personalizedMatch) return 'personalized';
    if (rec.metadata?.similarCreatorMatch) return 'similar_creators';
    if (rec.metadata?.seasonalMatch) return 'seasonal';
    return 'personalized';
  }

  // Update creator preferences
  async updateCreatorPreferences(creatorId: number, preferences: any) {
    const existing = await db
      .select()
      .from(creatorPreferences)
      .where(eq(creatorPreferences.creatorId, creatorId));
    
    if (existing.length > 0) {
      await db
        .update(creatorPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(creatorPreferences.creatorId, creatorId));
    } else {
      await db
        .insert(creatorPreferences)
        .values({
          creatorId,
          ...preferences,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    }
  }

  // Calculate and update similar creators
  async calculateSimilarCreators(creatorId: number) {
    try {
      // Get all creators except the current one
      const allCreators = await db
        .select()
        .from(creators)
        .where(sql`${creators.id} != ${creatorId}`);
      
      const similarities = [];
      
      for (const otherCreator of allCreators) {
        const similarityData = await this.calculateCreatorSimilarity(creatorId, otherCreator.id);
        if (similarityData.score > 60) { // Only store high similarity scores
          similarities.push({
            creatorId,
            similarCreatorId: otherCreator.id,
            similarityScore: similarityData.score.toString(),
            similarityFactors: similarityData.factors,
            calculatedAt: new Date(),
            createdAt: new Date(),
          });
        }
      }
      
      // Clear old similarities
      await db.delete(similarCreators)
        .where(eq(similarCreators.creatorId, creatorId));
      
      // Insert new similarities
      if (similarities.length > 0) {
        await db.insert(similarCreators).values(similarities);
      }
    } catch (error) {
      console.error("Error calculating similar creators:", error);
    }
  }

  private async calculateCreatorSimilarity(creatorId1: number, creatorId2: number) {
    let score = 0;
    const factors = [];
    
    // Get preferences for both creators
    const [prefs1] = await db.select().from(creatorPreferences).where(eq(creatorPreferences.creatorId, creatorId1));
    const [prefs2] = await db.select().from(creatorPreferences).where(eq(creatorPreferences.creatorId, creatorId2));
    
    // Category similarity
    if (prefs1?.preferredCategories && prefs2?.preferredCategories) {
      const common = prefs1.preferredCategories.filter((cat: string) => 
        prefs2.preferredCategories.includes(cat)
      );
      if (common.length > 0) {
        score += common.length * 15;
        factors.push(`${common.length} common categories`);
      }
    }
    
    // Location similarity
    if (prefs1?.location && prefs2?.location && prefs1.location === prefs2.location) {
      score += 10;
      factors.push('same location');
    }
    
    // Target audience similarity
    if (prefs1?.targetAudience && prefs2?.targetAudience && prefs1.targetAudience === prefs2.targetAudience) {
      score += 15;
      factors.push('same target audience');
    }
    
    // Brand style similarity
    if (prefs1?.brandStyle && prefs2?.brandStyle && prefs1.brandStyle === prefs2.brandStyle) {
      score += 10;
      factors.push('similar brand style');
    }
    
    return {
      score: Math.min(score, 100),
      factors
    };
  }
}