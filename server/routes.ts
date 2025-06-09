import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

// Extend Express session interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCreatorSchema, 
  insertProductSchema, 
  insertOrderSchema,
  insertAnalyticsSchema 
} from "@shared/schema";
import { PRICING_PLANS, getPlanById, calculateTransactionFee, canAddProduct, isTrialExpired, isSubscriptionActive } from "@shared/pricing";
import { detectCurrencyFromBrowser } from "@shared/currency";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
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
  
  // PayPal routes
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Pricing and subscription routes
  app.get("/api/pricing/plans", async (req: Request, res: Response) => {
    res.json(PRICING_PLANS);
  });

  app.post("/api/subscription/upgrade", async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      const { creatorId } = req.body;

      if (!creatorId) {
        return res.status(400).json({ message: "Creator ID is required" });
      }

      const plan = getPlanById(planId);
      if (!plan) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      const creator = await storage.getCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      // Update creator's plan
      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1); // 1 month subscription

      const updatedCreator = await storage.updateCreator(creatorId, {
        planType: planId,
        subscriptionStatus: planId === 'free' ? 'trial' : 'active',
        subscriptionEndsAt: planId === 'free' ? null : subscriptionEndsAt,
      });

      res.json({ 
        success: true, 
        creator: updatedCreator,
        plan: plan
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/subscription/status/:creatorId", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const creator = await storage.getCreator(creatorId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const plan = getPlanById(creator.planType);
      const trialExpired = creator.trialEndsAt ? isTrialExpired(creator.trialEndsAt) : false;
      const subscriptionActive = isSubscriptionActive(creator.subscriptionStatus, creator.subscriptionEndsAt);

      res.json({
        planType: creator.planType,
        subscriptionStatus: creator.subscriptionStatus,
        trialEndsAt: creator.trialEndsAt,
        subscriptionEndsAt: creator.subscriptionEndsAt,
        productCount: creator.productCount,
        trialExpired,
        subscriptionActive,
        planDetails: plan,
        canAddProducts: plan ? canAddProduct(creator.productCount || 0, creator.planType) : false
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      // Try to find user by username or email
      let user;
      if (username) {
        user = await storage.getUserByUsername(username);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      }
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create a simple token (user ID encoded)
      const token = Buffer.from(user.id.toString()).toString('base64');

      res.json({ 
        user: { ...user, password: undefined },
        token: token
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Add route to check authentication status
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const token = authHeader.substring(7);
      const userId = parseInt(Buffer.from(token, 'base64').toString());
      
      if (!userId) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Creator routes
  app.post("/api/creators", async (req: Request, res: Response) => {
    try {
      const creatorData = insertCreatorSchema.parse(req.body);
      
      // Check if handle is already taken
      const existingCreator = await storage.getCreatorByHandle(creatorData.storeHandle);
      if (existingCreator) {
        return res.status(400).json({ message: "Store handle already taken" });
      }

      const creator = await storage.createCreator(creatorData);
      res.json(creator);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/creators/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json(creator);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get creator by ID (numeric)
  app.get("/api/creators/:id(\\d+)", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const creator = await storage.getCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      res.json(creator);
    } catch (error: any) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ message: "Error fetching creator", error: error.message });
    }
  });

  // Get creator by handle (string)
  app.get("/api/creators/:handle", async (req: Request, res: Response) => {
    try {
      const { handle } = req.params;
      const creator = await storage.getCreatorByHandle(handle);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json(creator);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/creators/:id/products", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      console.log('Products API called for creator:', creatorId, 'Headers:', req.headers.authorization);
      const products = await storage.getProductsByCreator(creatorId);
      console.log('Products found:', products.length, 'items');
      res.json(products);
    } catch (error: any) {
      console.error('Products API error:', error.message);
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/creators/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const creator = await storage.updateCreator(id, updates);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json(creator);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Product routes with plan validation
  app.post("/api/products", upload.single("digitalFile"), async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        price: req.body.price.toString(), // Convert to string for decimal type
        creatorId: parseInt(req.body.creatorId),
        stock: req.body.stock ? parseInt(req.body.stock) : null,
      });

      // Check if creator can add more products based on their plan
      const creator = await storage.getCreator(productData.creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      // Validate plan limits
      if (!canAddProduct(creator.productCount || 0, creator.planType)) {
        const plan = getPlanById(creator.planType);
        return res.status(403).json({ 
          message: `Product limit reached. Your ${plan?.name || creator.planType} plan allows up to ${plan?.productLimit} products. Upgrade to add more.`,
          planLimit: plan?.productLimit,
          currentCount: creator.productCount
        });
      }
      
      // Check if trial has expired for free users
      if (creator.planType === 'free' && creator.trialEndsAt && isTrialExpired(creator.trialEndsAt)) {
        return res.status(403).json({ 
          message: "Your free trial has expired. Please upgrade to continue adding products.",
          trialExpired: true
        });
      }

      // If a file was uploaded, save the file path
      if (req.file) {
        productData.digitalFile = `/uploads/${req.file.filename}`;
      }

      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.price) {
        updates.price = parseFloat(updates.price);
      }
      
      const product = await storage.updateProduct(id, updates);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Order routes with transaction fee calculation
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        totalAmount: parseFloat(req.body.totalAmount),
        creatorId: parseInt(req.body.creatorId),
      });

      // Get creator to determine transaction fee
      const creator = await storage.getCreator(orderData.creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      // Calculate transaction fee based on creator's plan
      const orderAmount = parseFloat(orderData.totalAmount);
      const transactionFee = calculateTransactionFee(orderAmount, creator.planType || 'free');
      const creatorEarnings = orderAmount - transactionFee;
      
      // Auto-detect currency if not provided
      const orderCurrency = orderData.currency || 'USD';

      const order = await storage.createOrder({
        ...orderData,
        currency: orderCurrency
      });
      
      // Track purchase analytics
      await storage.createAnalytics({
        creatorId: order.creatorId,
        eventType: "purchase",
        eventData: {
          orderId: order.id,
          amount: orderAmount,
          currency: orderCurrency,
          transactionFee,
          creatorEarnings,
          planType: creator.planType
        }
      });
      
      res.json({
        ...order,
        transactionFee,
        creatorEarnings,
        feePercentage: getPlanById(creator.planType || 'free')?.transactionFee || 0
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/creators/:id/orders", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const orders = await storage.getOrdersByCreator(creatorId);
      res.json(orders);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const order = await storage.updateOrder(id, updates);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics routes
  app.post("/api/analytics", async (req: Request, res: Response) => {
    try {
      const analyticsData = insertAnalyticsSchema.parse({
        ...req.body,
        creatorId: parseInt(req.body.creatorId),
        productId: req.body.productId ? parseInt(req.body.productId) : undefined,
      });

      const analytics = await storage.createAnalytics(analyticsData);
      res.json(analytics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/creators/:id/analytics", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getAnalyticsByCreator(creatorId, start, end);
      res.json(analytics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // CUSTOMER PAYMENT ROUTES (for purchasing creator products)
  // M-Pesa payment routes for product purchases
  app.post("/api/payments/customer/mpesa", async (req: Request, res: Response) => {
    const { initiateMpesaPayment } = await import("./payments/mpesa");
    await initiateMpesaPayment(req, res);
  });

  app.get("/api/payments/customer/mpesa/status/:checkoutRequestId", async (req: Request, res: Response) => {
    const { checkMpesaStatus } = await import("./payments/mpesa");
    await checkMpesaStatus(req, res);
  });

  app.post("/api/payments/customer/mpesa/callback", async (req: Request, res: Response) => {
    const { mpesaCallback } = await import("./payments/mpesa");
    await mpesaCallback(req, res);
  });

  // Customer product purchase routes (Stripe)
  app.post("/api/payments/customer/stripe/payment-intent", async (req: Request, res: Response) => {
    const { createPaymentIntent } = await import("./payments/stripe");
    await createPaymentIntent(req, res);
  });

  app.post("/api/payments/customer/stripe/webhook", async (req: Request, res: Response) => {
    const { stripeWebhook } = await import("./payments/stripe");
    await stripeWebhook(req, res);
  });

  // Flutterwave payment routes (Cards, Mobile Money, Bank Transfer for Africa)
  app.post("/api/payments/customer/flutterwave", async (req: Request, res: Response) => {
    const { initiateFlutterwavePayment } = await import("./payments/flutterwave");
    await initiateFlutterwavePayment(req, res);
  });

  app.get("/api/payments/customer/flutterwave/verify/:transactionId", async (req: Request, res: Response) => {
    const { verifyFlutterwavePayment } = await import("./payments/flutterwave");
    await verifyFlutterwavePayment(req, res);
  });

  app.post("/api/payments/customer/flutterwave/webhook", async (req: Request, res: Response) => {
    const { flutterwaveWebhook } = await import("./payments/flutterwave");
    await flutterwaveWebhook(req, res);
  });

  app.get("/api/payments/banks/:country?", async (req: Request, res: Response) => {
    const { getFlutterwaveBanks } = await import("./payments/flutterwave");
    await getFlutterwaveBanks(req, res);
  });

  // CREATOR SUBSCRIPTION PAYMENT ROUTES (for platform fees)
  app.post("/api/payments/creator/subscription", async (req: Request, res: Response) => {
    const { createSubscription } = await import("./payments/stripe");
    await createSubscription(req, res);
  });

  app.post("/api/payments/creator/stripe/customer", async (req: Request, res: Response) => {
    const { createCustomer } = await import("./payments/stripe");
    await createCustomer(req, res);
  });

  // Bank transfer routes
  app.post("/api/payments/bank-transfer", async (req: Request, res: Response) => {
    const { initiateBankTransfer } = await import("./payments/bank-transfer");
    await initiateBankTransfer(req, res);
  });

  app.get("/api/payments/bank-accounts", async (req: Request, res: Response) => {
    const { getBankAccounts } = await import("./payments/bank-transfer");
    await getBankAccounts(req, res);
  });

  app.post("/api/payments/bank-transfer/:transferId/verify", async (req: Request, res: Response) => {
    const { verifyBankTransfer } = await import("./payments/bank-transfer");
    await verifyBankTransfer(req, res);
  });

  app.post("/api/payments/bank-transfer/webhook", async (req: Request, res: Response) => {
    const { bankTransferWebhook } = await import("./payments/bank-transfer");
    await bankTransferWebhook(req, res);
  });

  // PayPal routes
  app.get("/api/paypal/setup", async (req: Request, res: Response) => {
    const { loadPaypalDefault } = await import("./paypal");
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req: Request, res: Response) => {
    const { createPaypalOrder } = await import("./paypal");
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req: Request, res: Response) => {
    const { capturePaypalOrder } = await import("./paypal");
    await capturePaypalOrder(req, res);
  });

  // ADMIN ROUTES (for platform management)
  app.get("/api/admin/dashboard", async (req: Request, res: Response) => {
    try {
      // Check admin authorization using token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const userId = parseInt(Buffer.from(token, 'base64').toString());
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get platform statistics
      const allCreators = await storage.getCreators();
      const totalCreators = allCreators.length;
      const activeCreators = allCreators.filter(c => c.isActive).length;
      const paidCreators = allCreators.filter(c => c.planType !== 'free').length;

      // Calculate total platform revenue (simplified)
      const platformRevenue = paidCreators * 20; // Approximate based on plan types

      res.json({
        totalCreators,
        activeCreators,
        paidCreators,
        platformRevenue,
        creators: allCreators.slice(0, 10), // Recent creators
        recentActivity: [] // Would contain recent platform activity
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/creators", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const userId = parseInt(Buffer.from(token, 'base64').toString());
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const creators = await storage.getCreators();
      res.json(creators);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/creators/:id", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const userId = parseInt(Buffer.from(token, 'base64').toString());
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const creatorId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedCreator = await storage.updateCreator(creatorId, updates);
      res.json(updatedCreator);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/promote-user", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const adminUser = await storage.getUser(req.session.userId);
      if (!adminUser || !adminUser.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, role } = req.body;
      const updates: any = { role };
      
      if (role === 'admin') {
        updates.isAdmin = true;
      } else if (role === 'creator') {
        updates.isCreator = true;
      }

      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Debug endpoint to check users
  app.get("/api/debug/users", async (req: Request, res: Response) => {
    try {
      // Get all users for debugging
      const testUser = await storage.getUserByUsername("testerpeter");
      const adminUser = await storage.getUserByUsername("admintest");
      
      res.json({
        testUser: testUser ? { ...testUser, password: "***" } : null,
        adminUser: adminUser ? { ...adminUser, password: "***" } : null,
        totalUsers: "Cannot get count in this storage implementation"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin registration endpoint for new admin accounts
  app.post("/api/admin/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password, inviteCode } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Check invite code (simple security measure)
      const validInviteCode = "ADMIN2025"; // In production, this should be dynamic
      if (inviteCode !== validInviteCode) {
        return res.status(403).json({ message: "Invalid invite code" });
      }

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create new admin-only account
      const adminUser = await storage.createUser({
        username,
        email,
        password,
        isAdmin: true,
        role: "admin",
        isCreator: false // Admin accounts are not creators
      });

      res.json({ 
        message: "Admin account created successfully",
        user: { ...adminUser, password: undefined }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin setup endpoint for testing
  app.post("/api/admin/setup", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      // Find existing user and promote to admin
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = {
        isAdmin: true,
        role: 'admin'
      };

      const updatedUser = await storage.updateUser(user.id, updates);
      res.json({ message: "User promoted to admin", user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create admin test account endpoint
  app.post("/api/admin/create-test-account", async (req: Request, res: Response) => {
    try {
      // Create a dedicated admin test user
      const adminTestUser = {
        username: "admintest",
        email: "admin@test.com",
        password: "admin123"
      };

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(adminTestUser.username);
      if (existingUser) {
        // Update existing user to admin
        const updatedUser = await storage.updateUser(existingUser.id, {
          isAdmin: true,
          role: 'admin'
        });
        return res.json({ message: "Existing admin test account updated", user: updatedUser });
      }

      // Create new admin user
      const newUser = await storage.createUser(adminTestUser);
      const adminUser = await storage.updateUser(newUser.id, {
        isAdmin: true,
        role: 'admin'
      });

      res.json({ 
        message: "Admin test account created", 
        user: adminUser,
        credentials: {
          username: "admintest",
          password: "admin123"
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Legacy Stripe endpoint for compatibility
  app.post("/api/payments/stripe", async (req: Request, res: Response) => {
    try {
      const { amount, token, orderId } = req.body;
      
      // Simulate Stripe processing
      setTimeout(async () => {
        await storage.updateOrder(parseInt(orderId), {
          paymentStatus: "completed",
          paymentMethod: "stripe",
        });
      }, 1000);

      res.json({
        success: true,
        transactionId: `ch_${Date.now()}`,
        message: "Payment processed successfully",
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
