import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSocialProofData } from "./services/socialProof";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve static assets first (before any API routes)
  app.use("/assets", express.static(path.join(process.cwd(), "server/public/assets")));
  app.use(express.static(path.join(process.cwd(), "server/public")));
  
  // Payment configuration (African focus)
  app.get("/api/payments/config", async (req: Request, res: Response) => {
    try {
      res.json({
        availablePaymentMethods: [
          'pesapal',
          'mpesa',
          'bank_transfer'
        ],
        defaultCurrency: 'KES',
        supportedCountries: ['KE', 'UG', 'TZ', 'RW', 'NG', 'GH', 'ZA']
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch payment config" });
    }
  });

  // Social proof system
  app.get("/api/social-proof", async (req: Request, res: Response) => {
    try {
      const socialProofData = await getSocialProofData();
      res.json({ data: socialProofData });
    } catch (error: any) {
      console.error("Social proof error:", error);
      res.status(500).json({ message: "Failed to fetch social proof data" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Dropshipping Partner Management
  app.post("/api/dropshipping/partners/apply", async (req: Request, res: Response) => {
    try {
      const partnerData = req.body;
      
      // Create partner application (would use proper database in production)
      const partner = {
        id: Date.now(),
        ...partnerData,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json({ success: true, partner });
    } catch (error) {
      console.error("Partner application error:", error);
      res.status(500).json({ error: "Failed to submit partner application" });
    }
  });

  app.get("/api/dropshipping/partners", async (req: Request, res: Response) => {
    try {
      // Mock approved partners data
      const partners = [
        {
          id: 1,
          companyName: "Kenya Electronics Ltd",
          businessType: "wholesaler",
          logo: "/uploads/partner1-logo.png",
          description: "Leading electronics supplier in East Africa",
          defaultCommissionRate: "15.00",
          status: "approved"
        },
        {
          id: 2,
          companyName: "African Crafts Co",
          businessType: "manufacturer",
          logo: "/uploads/partner2-logo.png",
          description: "Authentic African crafts and accessories",
          defaultCommissionRate: "20.00",
          status: "approved"
        }
      ];

      res.json(partners);
    } catch (error) {
      console.error("Fetch partners error:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.get("/api/dropshipping/marketplace", async (req: Request, res: Response) => {
    try {
      const { category, search, page = 1, limit = 20 } = req.query;
      
      // Mock marketplace products
      const products = [
        {
          id: 1,
          name: "Bluetooth Wireless Earbuds",
          description: "High-quality wireless earbuds with noise cancellation",
          category: "Electronics",
          wholesalePrice: "2500.00",
          suggestedRetailPrice: "4000.00",
          minimumPrice: "3000.00",
          currency: "KES",
          images: ["/uploads/earbuds1.jpg", "/uploads/earbuds2.jpg"],
          stock: 150,
          commissionRate: "15.00",
          partner: {
            id: 1,
            companyName: "Kenya Electronics Ltd",
            logo: "/uploads/partner1-logo.png"
          }
        },
        {
          id: 2,
          name: "Handwoven Basket Set",
          description: "Traditional Kenyan baskets made from natural materials",
          category: "Home & Garden",
          wholesalePrice: "1200.00",
          suggestedRetailPrice: "2000.00",
          minimumPrice: "1500.00",
          currency: "KES",
          images: ["/uploads/basket1.jpg", "/uploads/basket2.jpg"],
          stock: 75,
          commissionRate: "20.00",
          partner: {
            id: 2,
            companyName: "African Crafts Co",
            logo: "/uploads/partner2-logo.png"
          }
        }
      ];

      // Filter by search if provided
      let filteredProducts = products;
      if (search) {
        filteredProducts = products.filter(p => 
          p.name.toLowerCase().includes(search.toString().toLowerCase()) ||
          p.description.toLowerCase().includes(search.toString().toLowerCase())
        );
      }

      if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
      }

      res.json(filteredProducts);
    } catch (error) {
      console.error("Fetch marketplace products error:", error);
      res.status(500).json({ error: "Failed to fetch marketplace products" });
    }
  });

  app.post("/api/creators/:creatorId/dropshipping/add-product", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const { dropshippingProductId, sellingPrice, customName, customDescription } = req.body;

      // Mock adding product to creator's store
      const creatorProduct = {
        id: Date.now(),
        creatorId: parseInt(creatorId),
        dropshippingProductId,
        customName,
        customDescription,
        sellingPrice,
        markup: parseFloat(sellingPrice) - 2500, // Mock wholesale price
        commissionRate: "15.00",
        isActive: true,
        salesCount: 0,
        revenue: "0.00",
        addedAt: new Date()
      };

      res.json({ success: true, product: creatorProduct });
    } catch (error) {
      console.error("Add dropshipping product error:", error);
      res.status(500).json({ error: "Failed to add product" });
    }
  });

  app.get("/api/creators/:creatorId/dropshipping/products", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      
      // Mock creator's dropshipping products
      const products = [
        {
          id: 1,
          customName: "Premium Wireless Earbuds",
          customDescription: "Perfect for music lovers and professionals",
          sellingPrice: "3500.00",
          markup: "1000.00",
          commissionRate: "15.00",
          salesCount: 12,
          revenue: "1800.00",
          isActive: true,
          originalProduct: {
            id: 1,
            name: "Bluetooth Wireless Earbuds",
            wholesalePrice: "2500.00",
            images: ["/uploads/earbuds1.jpg"],
            stock: 150,
            sku: "BWE-001"
          },
          partner: {
            id: 1,
            companyName: "Kenya Electronics Ltd",
            logo: "/uploads/partner1-logo.png"
          }
        }
      ];

      res.json(products);
    } catch (error) {
      console.error("Fetch creator dropshipping products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Intelligent Recommendation Engine Endpoints
  app.get("/api/creators/:creatorId/recommendations", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const { type = 'all', limit = 20 } = req.query;
      
      // Mock intelligent recommendations based on different algorithms
      const recommendations = [
        {
          id: 1,
          type: "dropshipping_product",
          name: "Smart Fitness Tracker",
          description: "Advanced fitness tracking with heart rate monitoring",
          price: "3500.00",
          images: ["/uploads/fitness-tracker.jpg"],
          category: "Electronics",
          score: 92,
          reason: "Trending in Electronics with 85% market growth this month",
          metadata: {
            wholesalePrice: "2200.00",
            commissionRate: "18.00",
            trendingCategory: true,
            recommendationType: "trending"
          },
          partner: {
            id: 1,
            companyName: "TechGear Africa",
            logo: "/uploads/techgear-logo.png"
          }
        },
        {
          id: 2,
          type: "dropshipping_product",
          name: "Organic Skincare Set",
          description: "Natural skincare products for daily routine",
          price: "2800.00",
          images: ["/uploads/skincare-set.jpg"],
          category: "Beauty & Health",
          score: 88,
          reason: "Matches your interests in Beauty & Health and fits your target audience",
          metadata: {
            wholesalePrice: "1800.00",
            commissionRate: "20.00",
            personalizedMatch: true,
            recommendationType: "personalized"
          },
          partner: {
            id: 2,
            companyName: "Natural Beauty Co",
            logo: "/uploads/beauty-logo.png"
          }
        },
        {
          id: 3,
          type: "dropshipping_product",
          name: "African Print Laptop Bag",
          description: "Stylish laptop bag with authentic African designs",
          price: "1800.00",
          images: ["/uploads/laptop-bag.jpg"],
          category: "Fashion & Accessories",
          score: 85,
          reason: "Popular among creators with similar audiences and product preferences",
          metadata: {
            wholesalePrice: "1200.00",
            commissionRate: "15.00",
            similarCreatorMatch: true,
            recommendationType: "similar_creators"
          },
          partner: {
            id: 3,
            companyName: "African Heritage Crafts",
            logo: "/uploads/heritage-logo.png"
          }
        },
        {
          id: 4,
          type: "dropshipping_product",
          name: "Solar Power Bank",
          description: "Eco-friendly portable charger with solar panel",
          price: "2500.00",
          images: ["/uploads/solar-powerbank.jpg"],
          category: "Electronics",
          score: 82,
          reason: "Perfect timing for Mid-Year sales in Electronics",
          metadata: {
            wholesalePrice: "1600.00",
            commissionRate: "17.00",
            seasonalMatch: true,
            recommendationType: "seasonal",
            season: "Mid-Year"
          },
          partner: {
            id: 4,
            companyName: "EcoTech Solutions",
            logo: "/uploads/ecotech-logo.png"
          }
        }
      ];

      // Filter by type if specified
      let filteredRecommendations = recommendations;
      if (type !== 'all') {
        filteredRecommendations = recommendations.filter(r => 
          r.metadata.recommendationType === type
        );
      }

      // Apply limit
      const limitedRecommendations = filteredRecommendations.slice(0, parseInt(limit as string));

      res.json(limitedRecommendations);
    } catch (error) {
      console.error("Fetch recommendations error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/creators/:creatorId/recommendations/track", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const { action, entityType, entityId, metadata } = req.body;
      
      // Track user behavior for recommendation learning
      console.log(`Tracking behavior for creator ${creatorId}:`, {
        action,
        entityType, 
        entityId,
        metadata
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Track behavior error:", error);
      res.status(500).json({ error: "Failed to track behavior" });
    }
  });

  app.get("/api/creators/:creatorId/preferences", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      
      // Mock creator preferences
      const preferences = {
        id: 1,
        creatorId: parseInt(creatorId),
        preferredCategories: ["Electronics", "Beauty & Health", "Fashion & Accessories"],
        targetAudience: "young_adults",
        budgetRange: { min: 1000, max: 5000, average: 2500 },
        location: "kenya",
        interests: ["technology", "beauty", "fashion", "lifestyle"],
        brandStyle: "affordable",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      res.json(preferences);
    } catch (error) {
      console.error("Fetch preferences error:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.put("/api/creators/:creatorId/preferences", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const preferences = req.body;
      
      // Update creator preferences
      console.log(`Updating preferences for creator ${creatorId}:`, preferences);
      
      const updatedPreferences = {
        ...preferences,
        creatorId: parseInt(creatorId),
        updatedAt: new Date().toISOString()
      };

      res.json(updatedPreferences);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  app.get("/api/market-trends", async (req: Request, res: Response) => {
    try {
      const { region = 'africa' } = req.query;
      
      // Mock market trends data
      const trends = [
        {
          id: 1,
          category: "Electronics",
          region: "africa",
          trendScore: "85.50",
          searchVolume: 15400,
          salesVelocity: "125.80",
          competitionLevel: "medium",
          priceRange: { min: 1000, max: 8000, average: 3200 },
          seasonality: { peak_months: [6, 7, 11, 12], low_months: [2, 3] },
          keywords: ["smartphone", "earbuds", "smartwatch", "power bank"],
          period: "2024-06",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          category: "Beauty & Health",
          region: "africa",
          trendScore: "78.20",
          searchVolume: 12800,
          salesVelocity: "95.40",
          competitionLevel: "high",
          priceRange: { min: 800, max: 4000, average: 1900 },
          seasonality: { peak_months: [3, 4, 10, 11], low_months: [1, 8] },
          keywords: ["skincare", "organic", "natural", "beauty routine"],
          period: "2024-06",
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          category: "Fashion & Accessories",
          region: "africa",
          trendScore: "72.90",
          searchVolume: 18600,
          salesVelocity: "110.20",
          competitionLevel: "high",
          priceRange: { min: 500, max: 3500, average: 1400 },
          seasonality: { peak_months: [4, 5, 9, 12], low_months: [1, 2] },
          keywords: ["african print", "accessories", "bags", "jewelry"],
          period: "2024-06",
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          category: "Home & Garden",
          region: "africa",
          trendScore: "68.40",
          searchVolume: 9200,
          salesVelocity: "67.30",
          competitionLevel: "low",
          priceRange: { min: 600, max: 5000, average: 2100 },
          seasonality: { peak_months: [3, 4, 9, 10], low_months: [6, 7] },
          keywords: ["home decor", "kitchen", "garden", "furniture"],
          period: "2024-06",
          createdAt: new Date().toISOString()
        }
      ];

      res.json(trends);
    } catch (error) {
      console.error("Fetch market trends error:", error);
      res.status(500).json({ error: "Failed to fetch market trends" });
    }
  });
  
  // Handle client-side routing only in production mode
  // In development, Vite handles this automatically
  if (process.env.NODE_ENV === 'production') {
    app.get("*", (req: Request, res: Response) => {
      // Skip serving HTML for asset requests
      if (req.path.startsWith('/assets/')) {
        return res.status(404).send('Asset not found');
      }
      res.sendFile(path.join(process.cwd(), "server/public/index.html"));
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}