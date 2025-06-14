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
  
  // Handle client-side routing (only for non-asset requests)
  app.get("*", (req: Request, res: Response) => {
    // Skip serving HTML for asset requests
    if (req.path.startsWith('/assets/')) {
      return res.status(404).send('Asset not found');
    }
    res.sendFile(path.join(process.cwd(), "server/public/index.html"));
  });

  const httpServer = createServer(app);
  return httpServer;
}