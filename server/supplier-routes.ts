import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { supplierDashboardService } from "./supplier-dashboard";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// Supplier authentication middleware
const requireSupplierAuth = async (req: any, res: Response, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check if user is associated with a dropshipping partner
  const partners = await storage.getDropshippingPartners();
  const userPartner = partners.find((p: any) => p.userId === req.session.user.id);
  
  if (!userPartner) {
    return res.status(403).json({ message: "Supplier access required" });
  }

  if (userPartner.status !== "approved" || !userPartner.isActive) {
    return res.status(403).json({ message: "Supplier account not approved or inactive" });
  }

  req.user = req.session.user;
  req.partner = userPartner;
  next();
};

// Mock function to get orders by partner
const getMockOrdersByPartner = async (partnerId: number): Promise<any[]> => {
  return [
    {
      id: 1,
      orderId: 101,
      partnerId: partnerId,
      creatorId: 1,
      dropshippingProductId: 1,
      quantity: 2,
      wholesalePrice: "2500.00",
      sellingPrice: "4000.00",
      creatorCommission: "300.00",
      partnerPayment: "5000.00",
      platformFee: "200.00",
      shippingAddress: {
        name: "John Doe",
        phone: "+254700123456",
        address: "123 Main St, Nairobi",
        city: "Nairobi",
        country: "Kenya"
      },
      customerInfo: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+254700123456"
      },
      status: "pending",
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
      partnerNotes: null,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date()
    }
  ];
};

export function registerSupplierRoutes(app: Express) {
  
  // Supplier Dashboard
  app.get("/api/supplier/dashboard", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const dashboardData = await supplierDashboardService.getDashboardData(req.partner.id);
      res.json(dashboardData);
    } catch (error: any) {
      console.error("Supplier dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Get supplier profile
  app.get("/api/supplier/profile", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      res.json(req.partner);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update supplier profile
  app.put("/api/supplier/profile", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const updates = req.body;
      const updatedPartner = await storage.updateDropshippingPartner(req.partner.id, updates);
      res.json(updatedPartner);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Product Management
  app.get("/api/supplier/products", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const { page = 1, limit = 20, search, category, status } = req.query;
      
      let products = await storage.getDropshippingProductsByPartner(req.partner.id);
      
      // Apply filters
      if (search) {
        products = products.filter((p: any) => 
          p.name.toLowerCase().includes(search.toString().toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toString().toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toString().toLowerCase())
        );
      }
      
      if (category) {
        products = products.filter((p: any) => p.category === category);
      }
      
      if (status) {
        if (status === "active") {
          products = products.filter((p: any) => p.isActive);
        } else if (status === "inactive") {
          products = products.filter((p: any) => !p.isActive);
        } else if (status === "low_stock") {
          products = products.filter((p: any) => p.stock < 10);
        }
      }

      // Pagination
      const pageNumber = parseInt(page.toString()) || 1;
      const limitNumber = parseInt(limit.toString()) || 20;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedProducts = products.slice(startIndex, endIndex);

      res.json({
        products: paginatedProducts,
        pagination: {
          currentPage: pageNumber,
          totalProducts: products.length,
          totalPages: Math.ceil(products.length / limitNumber),
          hasNext: endIndex < products.length,
          hasPrev: pageNumber > 1
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create new product
  app.post("/api/supplier/products", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const productData = {
        ...req.body,
        partnerId: req.partner.id,
        importSource: "manual"
      };
      
      const product = await storage.createDropshippingProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.put("/api/supplier/products/:id", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Verify product belongs to this supplier
      const products = await storage.getDropshippingProductsByPartner(req.partner.id);
      const product = products.find((p: any) => p.id === productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateDropshippingProduct(productId, req.body);
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Bulk update products
  app.post("/api/supplier/products/bulk-update", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const { updates } = req.body;
      const result = await supplierDashboardService.bulkUpdateProducts(req.partner.id, updates);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to bulk update products" });
    }
  });

  // Order Management
  app.get("/api/supplier/orders", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      
      let orders = await getMockOrdersByPartner(req.partner.id);
      
      // Apply filters
      if (status && status !== "all") {
        orders = orders.filter((o: any) => o.status === status);
      }
      
      if (search) {
        orders = orders.filter((o: any) => 
          o.trackingNumber?.toLowerCase().includes(search.toString().toLowerCase()) ||
          o.customerInfo?.name?.toLowerCase().includes(search.toString().toLowerCase()) ||
          o.id.toString().includes(search.toString())
        );
      }

      // Sort by creation date (newest first)
      orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Pagination
      const pageNumber = parseInt(page.toString()) || 1;
      const limitNumber = parseInt(limit.toString()) || 20;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedOrders = orders.slice(startIndex, endIndex);

      res.json({
        orders: paginatedOrders,
        pagination: {
          currentPage: pageNumber,
          totalOrders: orders.length,
          totalPages: Math.ceil(orders.length / limitNumber),
          hasNext: endIndex < orders.length,
          hasPrev: pageNumber > 1
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status
  app.put("/api/supplier/orders/:id/status", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status, trackingNumber, notes } = req.body;
      
      // Verify order belongs to this supplier
      const orders = await getMockOrdersByPartner(req.partner.id);
      const order = orders.find((o: any) => o.id === orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await supplierDashboardService.updateOrderStatus(
        orderId, 
        status, 
        trackingNumber, 
        notes
      );
      
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Analytics
  app.get("/api/supplier/analytics", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const { period = "30d" } = req.query;
      const analytics = await supplierDashboardService.getOrderAnalytics(req.partner.id, period.toString());
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Product Categories
  app.get("/api/supplier/categories", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const products = await storage.getDropshippingProductsByPartner(req.partner.id);
      const categories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // CSV Import
  app.post("/api/supplier/products/import-csv", requireSupplierAuth, upload.single("csv"), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required" });
      }

      const csvData = fs.readFileSync(req.file.path, 'utf-8');
      const { productSyncService } = await import("./product-sync");
      
      const result = await productSyncService.processCsvImport(req.partner.id, csvData, req.user.id);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to import CSV" });
    }
  });

  // Export products to CSV
  app.get("/api/supplier/products/export-csv", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const products = await storage.getDropshippingProductsByPartner(req.partner.id);
      
      // Create CSV content
      const headers = [
        "ID", "Name", "Description", "Category", "SKU", 
        "Wholesale Price", "Suggested Retail Price", "Stock", 
        "Active", "Created At"
      ];
      
      const csvRows = [
        headers.join(","),
        ...products.map((product: any) => [
          product.id,
          `"${product.name.replace(/"/g, '""')}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          product.category || '',
          product.sku || '',
          product.wholesalePrice,
          product.suggestedRetailPrice || '',
          product.stock,
          product.isActive ? 'Yes' : 'No',
          product.createdAt.toISOString().split('T')[0]
        ].join(","))
      ];
      
      const csvContent = csvRows.join("\n");
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`);
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to export products" });
    }
  });

  // Sync logs
  app.get("/api/supplier/sync-logs", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const logs = await storage.getProductSyncLogs(req.partner.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch sync logs" });
    }
  });

  // Manual product sync
  app.post("/api/supplier/sync", requireSupplierAuth, async (req: any, res: Response) => {
    try {
      const { productSyncService } = await import("./product-sync");
      const result = await productSyncService.syncProducts(req.partner.id, req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to sync products" });
    }
  });

  // Upload product images
  app.post("/api/supplier/products/:id/images", requireSupplierAuth, upload.array("images", 10), async (req: any, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Verify product belongs to this supplier
      const products = await storage.getDropshippingProductsByPartner(req.partner.id);
      const product = products.find((p: any) => p.id === productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }

      // Process uploaded images
      const imageUrls = (req.files as any[]).map((file: any) => `/uploads/${file.filename}`);
      
      // Update product with new images
      const currentImages = product.images || [];
      const updatedImages = [...currentImages, ...imageUrls];
      
      const updatedProduct = await storage.updateDropshippingProduct(productId, {
        images: updatedImages
      });
      
      res.json({ 
        message: "Images uploaded successfully",
        images: imageUrls,
        product: updatedProduct
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to upload images" });
    }
  });
}

