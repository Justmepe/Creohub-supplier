import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSocialProofData } from "./services/socialProof";
import { registerSupplierRoutes } from "./supplier-routes";
import "./storage-extensions"; // Load storage extensions
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

// Authentication middleware
const requireAuth = (req: any, res: Response, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.user = req.session.user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register supplier routes
  registerSupplierRoutes(app);
  
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login request body:", req.body);
      const { email, password } = req.body;
      console.log(`Login attempt - email: ${email}, password: ${password}`);
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isEmailVerified: user.isEmailVerified,
          isAdmin: user.isAdmin,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Create user
      const user = await storage.createUser({ email, password, username });

      res.status(201).json({
        message: "User registered successfully",
        user: { id: user.id, email: user.email, username: user.username }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });
  
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

  // Creator API routes
  app.get("/api/creators/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json(creator);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/creators/:id(\\d+)", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const creator = await storage.getCreator(creatorId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json(creator);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/creators/:handle", async (req: Request, res: Response) => {
    try {
      const handle = req.params.handle;
      const creator = await storage.getCreatorByHandle(handle);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json(creator);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/creators/:id/products", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const products = await storage.getProductsByCreator(creatorId);
      
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Dropshipping Partner Management
  app.post("/api/dropshipping/partners/apply", async (req: Request, res: Response) => {
    try {
      const { 
        companyName, 
        businessLicense, 
        contactEmail, 
        contactPhone, 
        address, 
        businessType, 
        description, 
        website, 
        defaultCommissionRate 
      } = req.body;

      // Create supplier partner application
      const partnerData = {
        userId: req.session?.userId || 1, // Default for now, would need auth
        companyName,
        businessLicense: businessLicense || null,
        contactEmail,
        contactPhone,
        address,
        businessType,
        description,
        website: website || null,
        defaultCommissionRate,
        status: "pending",
        isActive: false // Will be activated after approval
      };

      const newPartner = await storage.createDropshippingPartner(partnerData);

      res.json({ 
        success: true, 
        partner: newPartner,
        message: "Supplier application submitted successfully. You will be contacted within 2-3 business days." 
      });
    } catch (error) {
      console.error("Partner application error:", error);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  app.get("/api/dropshipping/partners", async (req: Request, res: Response) => {
    try {
      // Get approved partners from storage
      const allPartners = await storage.getDropshippingPartners();
      const approvedPartners = allPartners.filter(partner => 
        partner.status === "approved" && partner.isActive
      );

      res.json(approvedPartners);
    } catch (error) {
      console.error("Fetch partners error:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.get("/api/dropshipping/marketplace", async (req: Request, res: Response) => {
    try {
      const { category, search, page = 1, limit = 20 } = req.query;
      
      // Get all active dropshipping products from storage
      const allProducts = await storage.getDropshippingProducts();
      const activeProducts = allProducts.filter(product => product.isActive);

      // Get all partners to include partner information
      const allPartners = await storage.getDropshippingPartners();
      const partnersMap = new Map(allPartners.map(partner => [partner.id, partner]));

      // Enhance products with partner information
      const productsWithPartners = activeProducts.map(product => {
        const partner = partnersMap.get(product.partnerId);
        return {
          ...product,
          partner: partner ? {
            id: partner.id,
            companyName: partner.companyName,
            businessType: partner.businessType
          } : null
        };
      }).filter(product => product.partner); // Only include products with valid partners

      // Filter by search if provided
      let filteredProducts = productsWithPartners;
      if (search) {
        filteredProducts = productsWithPartners.filter(p => 
          p.name.toLowerCase().includes(search.toString().toLowerCase()) ||
          p.description.toLowerCase().includes(search.toString().toLowerCase()) ||
          p.category.toLowerCase().includes(search.toString().toLowerCase())
        );
      }

      // Filter by category if provided
      if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
      }

      // Implement pagination
      const pageNumber = parseInt(page.toString()) || 1;
      const limitNumber = parseInt(limit.toString()) || 20;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      res.json({
        products: paginatedProducts,
        pagination: {
          currentPage: pageNumber,
          totalProducts: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / limitNumber),
          hasNext: endIndex < filteredProducts.length,
          hasPrev: pageNumber > 1
        }
      });
    } catch (error) {
      console.error("Fetch marketplace products error:", error);
      res.status(500).json({ error: "Failed to fetch marketplace products" });
    }
  });

  // Get creator by user ID
  app.get("/api/creators/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }
      
      res.json(creator);
    } catch (error) {
      console.error("Get creator by user ID error:", error);
      res.status(500).json({ error: "Failed to get creator" });
    }
  });

  app.post("/api/creators/:creatorId/dropshipping/add-product", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const { dropshippingProductId, sellingPrice, customName, customDescription } = req.body;

      // Get the original dropshipping product details
      const dropshippingProducts = [
        {
          id: 1,
          name: "Bluetooth Wireless Earbuds",
          description: "High-quality wireless earbuds with noise cancellation",
          category: "Electronics",
          wholesalePrice: "2500.00",
          images: ["/uploads/earbuds1.jpg"],
          stock: 150
        },
        {
          id: 2,
          name: "Premium Skincare Set",
          description: "Natural skincare products made in Kenya",
          category: "Beauty & Health",
          wholesalePrice: "1800.00",
          images: ["/uploads/skincare1.jpg"],
          stock: 75
        },
        {
          id: 3,
          name: "African Print Laptop Bag",
          description: "Stylish laptop bag with authentic African designs",
          category: "Fashion & Accessories", 
          wholesalePrice: "1200.00",
          images: ["/uploads/laptop-bag.jpg"],
          stock: 100
        }
      ];

      const originalProduct = dropshippingProducts.find(p => p.id === dropshippingProductId);
      if (!originalProduct) {
        return res.status(404).json({ error: "Dropshipping product not found" });
      }

      // Create a regular product for the creator's store
      const productData = {
        creatorId: parseInt(creatorId),
        name: customName || originalProduct.name,
        description: customDescription || originalProduct.description,
        price: sellingPrice,
        currency: "KES",
        type: "physical",
        category: originalProduct.category,
        images: originalProduct.images,
        stock: originalProduct.stock,
        isActive: true
      };

      // Add the product to the creator's store
      const newProduct = await storage.createProduct(productData);

      res.json({ 
        success: true, 
        product: newProduct,
        message: "Product added to your store successfully" 
      });
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
      
      // Get all available dropshipping products from real suppliers
      const allDropshippingProducts = await storage.getDropshippingProducts();
      const activeProducts = allDropshippingProducts.filter(product => product.isActive);
      
      // Get all partners for enhanced recommendations
      const allPartners = await storage.getDropshippingPartners();
      
      // Simple recommendations based on available products
      const recommendations = activeProducts.map(product => {
        const partner = allPartners.find(p => p.id === product.partnerId);
        if (!partner) return null;
        
        const wholesalePrice = parseFloat(product.wholesalePrice);
        const suggestedPrice = parseFloat(product.suggestedRetailPrice);
        const profitMargin = ((suggestedPrice - wholesalePrice) / suggestedPrice) * 100;
        
        return {
          id: product.id,
          type: "dropshipping_product",
          name: product.name,
          description: product.description,
          price: product.suggestedRetailPrice,
          images: product.images,
          category: product.category,
          score: Math.min(70 + profitMargin, 100),
          reason: `Great ${product.category} opportunity with ${profitMargin.toFixed(1)}% margin`,
          metadata: {
            wholesalePrice: product.wholesalePrice,
            commissionRate: product.commissionRate,
            stock: product.stock,
            recommendationType: "general",
            profitMargin: profitMargin.toFixed(1),
            partnerId: partner.id
          },
          partner: {
            id: partner.id,
            companyName: partner.companyName,
            businessType: partner.businessType
          }
        };
      }).filter(product => product !== null);

      // Apply limit
      const limitedRecommendations = recommendations.slice(0, parseInt(limit as string));

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

  // Admin routes
  app.get("/api/admin/dashboard", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const creators = await storage.getAllCreators();
      
      res.json({
        totalUsers: users.length,
        totalCreators: creators.length,
        totalRevenue: "45,890.50",
        totalOrders: 156,
        users: users.slice(0, 5), // Recent users
        creators: creators.slice(0, 5) // Recent creators
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/creators", async (req: Request, res: Response) => {
    try {
      const creators = await storage.getAllCreators();
      res.json(creators);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch creators" });
    }
  });

  app.get("/api/admin/withdrawals", async (req: Request, res: Response) => {
    try {
      const withdrawals = await storage.getAllWithdrawalRequests();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Product Sync and Management API
  app.post("/api/dropshipping/partners/:id/sync", requireAuth, async (req: any, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      const { productSyncService } = await import("./product-sync");
      
      const result = await productSyncService.syncProducts(partnerId, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/dropshipping/partners/:id/csv-import", requireAuth, upload.single("csv"), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required" });
      }

      const partnerId = parseInt(req.params.id);
      const csvData = req.file.buffer.toString('utf-8');
      const { productSyncService } = await import("./product-sync");
      
      const result = await productSyncService.processCsvImport(partnerId, csvData, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dropshipping/partners/:id/sync-logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      const logs = await storage.getProductSyncLogs(partnerId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch sync logs" });
    }
  });

  app.post("/api/dropshipping/products", requireAuth, async (req: any, res: Response) => {
    try {
      const productData = {
        ...req.body,
        importSource: "manual"
      };
      const product = await storage.createDropshippingProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/dropshipping/products/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.updateDropshippingProduct(productId, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.get("/api/dropshipping/partners/:id/products", async (req: Request, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      const products = await storage.getDropshippingProductsByPartner(partnerId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Admin routes for dropshipping partner management
  app.get("/api/admin/dropshipping/partners", async (req: Request, res: Response) => {
    try {
      const partners = await storage.getDropshippingPartners();
      res.json(partners);
    } catch (error) {
      console.error("Failed to fetch dropshipping partners:", error);
      res.status(500).json({ error: "Failed to fetch dropshipping partners" });
    }
  });

  app.put("/api/admin/dropshipping/partners/:id/approve", async (req: Request, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      await storage.updateDropshippingPartner(partnerId, { status: 'approved' });
      res.json({ success: true, message: "Partner approved successfully" });
    } catch (error) {
      console.error("Failed to approve partner:", error);
      res.status(500).json({ error: "Failed to approve partner" });
    }
  });

  app.put("/api/admin/dropshipping/partners/:id/reject", async (req: Request, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      await storage.updateDropshippingPartner(partnerId, { status: 'rejected' });
      res.json({ success: true, message: "Partner rejected successfully" });
    } catch (error) {
      console.error("Failed to reject partner:", error);
      res.status(500).json({ error: "Failed to reject partner" });
    }
  });

  // Create test supplier account
  app.post("/api/admin/create-test-supplier", async (req: Request, res: Response) => {
    try {
      // Create test user for supplier
      const testUser = await storage.createUser({
        email: "supplier@test.com",
        password: "supplier123",
        username: "testsupplier",
        isEmailVerified: true
      });

      // Create dropshipping partner
      const partnerData = {
        userId: testUser.id,
        companyName: "Test Supply Co.",
        businessLicense: "TSC-2024-001",
        contactEmail: "supplier@test.com",
        contactPhone: "+254700123456",
        address: "123 Business Street, Nairobi, Kenya",
        businessType: "wholesale",
        description: "Test supplier for electronics and gadgets",
        website: "https://testsupply.co.ke",
        defaultCommissionRate: 15,
        status: "approved",
        isActive: true
      };

      const supplier = await storage.createDropshippingPartner(partnerData);

      // Create some test products for the supplier
      const testProducts = [
        {
          partnerId: supplier.id,
          name: "Wireless Bluetooth Headphones",
          description: "High-quality wireless headphones with noise cancellation",
          category: "Electronics",
          wholesalePrice: "2500.00",
          suggestedRetailPrice: "4000.00",
          commissionRate: 15,
          stock: 50,
          images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
          isActive: true,
          importSource: "manual"
        },
        {
          partnerId: supplier.id,
          name: "Smart Phone Case",
          description: "Protective phone case with wireless charging support",
          category: "Phone Accessories",
          wholesalePrice: "800.00",
          suggestedRetailPrice: "1500.00",
          commissionRate: 15,
          stock: 100,
          images: ["https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400"],
          isActive: true,
          importSource: "manual"
        },
        {
          partnerId: supplier.id,
          name: "Portable Power Bank",
          description: "20000mAh fast charging power bank with LED display",
          category: "Electronics",
          wholesalePrice: "1200.00",
          suggestedRetailPrice: "2200.00",
          commissionRate: 15,
          stock: 75,
          images: ["https://images.unsplash.com/photo-1609592842029-16b6de6523b3?w=400"],
          isActive: true,
          importSource: "manual"
        }
      ];

      for (const productData of testProducts) {
        await storage.createDropshippingProduct(productData);
      }

      res.json({
        message: "Test supplier account created successfully",
        credentials: {
          email: "supplier@test.com",
          password: "supplier123",
          username: "testsupplier"
        },
        supplier: supplier,
        productsCreated: testProducts.length
      });
    } catch (error: any) {
      console.error("Test supplier creation error:", error);
      res.status(500).json({ message: "Failed to create test supplier account" });
    }
  });
  
  // Handle client-side routing only in production mode
  // In development, Vite handles this automatically
  if (process.env.NODE_ENV === 'production') {
    app.get("*", (req: Request, res: Response) => {
      // Skip serving HTML for API routes and asset requests
      if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
        return res.status(404).send('Not found');
      }
      res.sendFile(path.join(process.cwd(), "server/public/index.html"));
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}