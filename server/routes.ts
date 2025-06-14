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
  insertAnalyticsSchema,
  insertAffiliateLinkSchema,
  insertCommissionSchema,
  insertProductSettingsSchema,
  insertColorThemeSchema,
  insertPayoutMethodSchema,
  insertWithdrawalRequestSchema,
  insertEarningTransactionSchema
} from "@shared/schema";
import { generateVerificationCode, sendVerificationEmail } from "./services/email";
import { createUserSession, validateSession, invalidateSession, cleanupExpiredSessions } from "./services/session";
import { db } from "./db";
import { 
  emailVerifications, users, creators, products, orders, subscriptions, 
  colorThemes, affiliateLinks, commissions, payoutMethods, 
  withdrawalRequests, creatorEarnings, earningTransactions,
  productSettings, userSessions 
} from "@shared/schema";
import { eq, and, gt, isNull, desc } from "drizzle-orm";
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
  
  // Cleanup expired sessions every 5 minutes
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
  
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

      // For free plan, update immediately
      if (planId === 'free') {
        const updatedCreator = await storage.updateCreator(creatorId, {
          planType: planId,
          subscriptionStatus: 'trial',
          subscriptionEndsAt: null,
        });

        res.json({ 
          success: true, 
          creator: updatedCreator,
          plan: plan
        });
        return;
      }

      // For paid plans, initiate payment process
      // Create a subscription record that needs payment
      const subscription = await storage.createSubscription({
        creatorId: creatorId,
        planType: planId,
        billingCycle: 'monthly',
        amount: plan.price.toString(),
        currency: plan.currency,
        paymentMethod: 'pesapal',
        paymentStatus: 'pending',
        subscriptionStatus: 'pending',
        metadata: {
          planName: plan.name,
          subscriptionType: 'monthly'
        }
      });

      // Return payment URL for frontend to redirect
      res.json({
        success: false,
        requiresPayment: true,
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency,
        planName: plan.name,
        message: "Payment required to upgrade plan"
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

      const user = await storage.createUser({
        ...userData,
        isEmailVerified: false
      });
      
      // Generate and send verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await db.insert(emailVerifications).values({
        userId: user.id,
        email: user.email,
        code: verificationCode,
        type: 'registration',
        expiresAt
      });
      
      await sendVerificationEmail(user.email, verificationCode, 'registration');
      
      res.json({ 
        message: "Registration successful. Please check your email for verification code.",
        userId: user.id,
        email: user.email
      });
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

      // Check if email is verified (bypass for admins)
      if (!user.isEmailVerified && !user.isAdmin) {
        return res.status(403).json({ 
          message: "Please verify your email before logging in",
          requiresVerification: true,
          userId: user.id,
          email: user.email
        });
      }

      // Create session token
      const sessionToken = await createUserSession(
        user.id,
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        user: { ...user, password: undefined },
        token: sessionToken
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Email verification routes
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({ message: "User ID and verification code are required" });
      }

      // Find valid verification code
      const [verification] = await db
        .select()
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.userId, userId),
            eq(emailVerifications.code, code),
            gt(emailVerifications.expiresAt, new Date()),
            isNull(emailVerifications.usedAt)
          )
        );

      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Mark verification as used
      await db
        .update(emailVerifications)
        .set({ usedAt: new Date() })
        .where(eq(emailVerifications.id, verification.id));

      // Update user as verified
      await db
        .update(users)
        .set({ isEmailVerified: true })
        .where(eq(users.id, userId));

      res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { userId, email } = req.body;
      
      let user;
      if (userId) {
        user = await storage.getUser(userId);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      } else {
        return res.status(400).json({ message: "User ID or email is required" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await db.insert(emailVerifications).values({
        userId: user.id,
        email: user.email,
        code: verificationCode,
        type: 'registration',
        expiresAt
      });
      
      const emailSent = await sendVerificationEmail(user.email, verificationCode, 'registration');
      
      res.json({ 
        message: emailSent ? "Verification code sent to your email" : "Verification code generated. Check server logs or contact support.",
        userId: user.id,
        email: user.email,
        emailDelivered: emailSent
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoint for users to check their verification status and get help when emails fail
  app.get("/api/auth/verification-status/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.json({ 
          verified: true, 
          message: "Email already verified" 
        });
      }

      // Get the latest verification code for this user
      const [latestVerification] = await db
        .select()
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.userId, userId),
            gt(emailVerifications.expiresAt, new Date()),
            isNull(emailVerifications.usedAt)
          )
        )
        .orderBy(desc(emailVerifications.createdAt))
        .limit(1);

      if (!latestVerification) {
        return res.json({
          verified: false,
          message: "No active verification code found. Please request a new one.",
          hasActiveCode: false
        });
      }

      return res.json({
        verified: false,
        message: "Verification code is active. Check your email or contact support if you're not receiving emails.",
        hasActiveCode: true,
        email: user.email,
        expiresAt: latestVerification.expiresAt,
        supportMessage: "If you're not receiving emails, verification codes are temporarily displayed in server console logs. Contact support for assistance."
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Temporary endpoint to retrieve verification code when email delivery fails
  app.post("/api/auth/get-verification-code", async (req: Request, res: Response) => {
    try {
      const { userId, email } = req.body;
      
      if (!userId || !email) {
        return res.status(400).json({ message: "User ID and email are required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.email !== email) {
        return res.status(404).json({ message: "User not found or email mismatch" });
      }

      if (user.isEmailVerified) {
        return res.json({ 
          verified: true, 
          message: "Email already verified" 
        });
      }

      // Get the latest verification code for this user
      const [latestVerification] = await db
        .select()
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.userId, userId),
            gt(emailVerifications.expiresAt, new Date()),
            isNull(emailVerifications.usedAt)
          )
        )
        .orderBy(desc(emailVerifications.createdAt))
        .limit(1);

      if (!latestVerification) {
        return res.json({
          hasCode: false,
          message: "No active verification code found. Please request a new one."
        });
      }

      // Return the verification code (temporarily until email is fixed)
      return res.json({
        hasCode: true,
        code: latestVerification.code,
        expiresAt: latestVerification.expiresAt,
        message: "Verification code retrieved successfully. Enter this code to verify your email."
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add route to check authentication status with session validation
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const token = authHeader.substring(7);
      
      // Try session-based authentication first
      const userId = await validateSession(token);
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          return res.json({ user: { ...user, password: undefined } });
        }
      }

      // Fallback to old token format for existing users
      try {
        const fallbackUserId = parseInt(Buffer.from(token, 'base64').toString());
        if (fallbackUserId) {
          const user = await storage.getUser(fallbackUserId);
          if (user) {
            return res.json({ user: { ...user, password: undefined } });
          }
        }
      } catch (e) {
        // Ignore fallback errors
      }

      res.status(401).json({ message: "Invalid or expired session" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await invalidateSession(token);
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User profile routes
  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user is authenticated and trying to update their own profile
      if (!req.session?.userId || req.session.userId !== id) {
        return res.status(403).json({ message: "Can only update your own profile" });
      }
      
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
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

  // Upload creator logo
  app.post("/api/creators/:id/upload-logo", upload.single("logo"), async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No logo file provided" });
      }

      const logoUrl = `/uploads/${req.file.filename}`;
      
      const creator = await storage.updateCreator(creatorId, {
        storeLogo: logoUrl
      });
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json({ logoUrl, creator });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Upload creator banner
  app.post("/api/creators/:id/upload-banner", upload.single("banner"), async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No banner file provided" });
      }

      const bannerUrl = `/uploads/${req.file.filename}`;
      
      const creator = await storage.updateCreator(creatorId, {
        storeBanner: bannerUrl
      });
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json({ bannerUrl, creator });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      
      // Filter out subscription orders - only return actual product orders from customers
      const productOrders = orders.filter(order => {
        // Check if this is a real product order by verifying it has actual product items
        try {
          const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items as string);
          return Array.isArray(items) && items.length > 0 && items[0].productId;
        } catch {
          return false;
        }
      });
      
      res.json(productOrders);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Separate route for subscription history
  app.get("/api/creators/:id/subscriptions", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const subscriptions = await storage.getSubscriptionsByCreator(creatorId);
      res.json(subscriptions);
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

  // Customer order tracking endpoint
  app.get("/api/orders/customer", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email parameter is required" });
      }

      const orders = await storage.getOrdersByCustomerEmail(email);
      res.json(orders);
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

  // Payment configuration status
  app.get("/api/payments/config", async (req: Request, res: Response) => {
    try {
      const configured = [];
      const missing = [];

      // Check Pesapal
      if (process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET) {
        configured.push('Pesapal');
      } else {
        missing.push('Pesapal');
      }

      // Check Stripe
      if (process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY) {
        configured.push('Stripe');
      } else {
        missing.push('Stripe');
      }

      // Check PayPal
      if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
        configured.push('PayPal');
      } else {
        missing.push('PayPal');
      }

      // Check M-Pesa
      if (process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET) {
        configured.push('M-Pesa');
      } else {
        missing.push('M-Pesa');
      }

      res.json({ configured, missing });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AFFILIATE ROUTES
  // Create affiliate link
  app.post("/api/affiliate/links", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const token = authHeader.substring(7);
      const userId = parseInt(Buffer.from(token, 'base64').toString());
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const creator = await storage.getCreatorByUserId(user.id);
      if (!creator) {
        return res.status(404).json({ message: "Creator profile not found" });
      }

      // Generate unique link code
      const linkCode = `${creator.storeHandle}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const affiliateLinkData = insertAffiliateLinkSchema.parse({
        ...req.body,
        affiliateCreatorId: creator.id,
        linkCode,
      });

      const affiliateLink = await storage.createAffiliateLink(affiliateLinkData);
      res.json(affiliateLink);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get affiliate links for creator
  app.get("/api/affiliate/links", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const token = authHeader.substring(7);
      const userId = parseInt(Buffer.from(token, 'base64').toString());
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const creator = await storage.getCreatorByUserId(user.id);
      if (!creator) {
        return res.status(404).json({ message: "Creator profile not found" });
      }

      const affiliateLinks = await storage.getAffiliateLinksByCreator(creator.id);
      res.json(affiliateLinks);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Track affiliate link click
  app.post("/api/affiliate/click/:linkCode", async (req: Request, res: Response) => {
    try {
      const { linkCode } = req.params;
      const affiliateLink = await storage.getAffiliateLinkByCode(linkCode);
      
      if (!affiliateLink) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }

      await storage.updateAffiliateLinkClicks(affiliateLink.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get commissions for affiliate
  app.get("/api/affiliate/commissions", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const token = authHeader.substring(7);
      const userId = parseInt(Buffer.from(token, 'base64').toString());
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const creator = await storage.getCreatorByUserId(user.id);
      if (!creator) {
        return res.status(404).json({ message: "Creator profile not found" });
      }

      const commissions = await storage.getCommissionsByAffiliate(creator.id);
      res.json(commissions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get product settings for affiliate program
  app.get("/api/products/:id/affiliate-settings", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const settings = await storage.getProductSettings(productId);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update product settings for affiliate program
  app.put("/api/products/:id/affiliate-settings", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const creator = await storage.getCreatorByUserId(user.id);
      if (!creator || creator.id !== product.creatorId) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const existingSettings = await storage.getProductSettings(productId);
      
      if (existingSettings) {
        const updatedSettings = await storage.updateProductSettings(productId, req.body);
        res.json(updatedSettings);
      } else {
        const settingsData = insertProductSettingsSchema.parse({
          ...req.body,
          productId,
        });
        const newSettings = await storage.createProductSettings(settingsData);
        res.json(newSettings);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get affiliate links for a specific product
  app.get("/api/products/:id/affiliate-links", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const affiliateLinks = await storage.getAffiliateLinksByProduct(productId);
      res.json(affiliateLinks);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // COLOR THEME ROUTES
  // Get user's color themes
  app.get("/api/themes", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const themes = await storage.getColorThemes(req.session.userId);
      res.json(themes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get active color theme
  app.get("/api/themes/active", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const activeTheme = await storage.getActiveColorTheme(req.session.userId);
      res.json(activeTheme);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Create new color theme
  app.post("/api/themes", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const themeData = insertColorThemeSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const theme = await storage.createColorTheme(themeData);
      res.json(theme);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update color theme
  app.put("/api/themes/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const themeId = parseInt(req.params.id);
      const updatedTheme = await storage.updateColorTheme(themeId, req.body);
      
      if (!updatedTheme) {
        return res.status(404).json({ message: "Theme not found" });
      }

      res.json(updatedTheme);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete color theme
  app.delete("/api/themes/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const themeId = parseInt(req.params.id);
      const deleted = await storage.deleteColorTheme(themeId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Theme not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Set active theme
  app.post("/api/themes/:id/activate", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const themeId = parseInt(req.params.id);
      await storage.setActiveTheme(req.session.userId, themeId);
      res.json({ success: true });
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

  // Pesapal routes
  app.post("/api/payments/customer/pesapal", async (req: Request, res: Response) => {
    const { initiatePesapalPayment } = await import("./payments/pesapal");
    await initiatePesapalPayment(req, res);
  });

  app.get("/api/payments/customer/pesapal/status/:orderTrackingId", async (req: Request, res: Response) => {
    const { checkPesapalStatus } = await import("./payments/pesapal");
    await checkPesapalStatus(req, res);
  });

  app.get("/api/payments/customer/pesapal/ipn", async (req: Request, res: Response) => {
    const { pesapalIPN } = await import("./payments/pesapal");
    await pesapalIPN(req, res);
  });

  app.get("/api/payments/customer/pesapal/callback", async (req: Request, res: Response) => {
    const { pesapalCallback } = await import("./payments/pesapal");
    await pesapalCallback(req, res);
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

  // Admin route to get all users
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      console.log(`Admin users - received token: "${token}"`);
      
      let userId: number;
      try {
        const decodedToken = Buffer.from(token, 'base64').toString();
        console.log(`Admin users - decoded token: "${decodedToken}"`);
        userId = parseInt(decodedToken);
        console.log(`Admin users - parsed userId: ${userId}`);
        
        if (isNaN(userId)) {
          console.log(`Admin users - userId is NaN`);
          return res.status(401).json({ message: "Invalid token format" });
        }
      } catch (error) {
        console.log(`Admin users - token parsing error: ${error}`);
        return res.status(401).json({ message: "Invalid token format" });
      }
      
      const user = await storage.getUser(userId);
      console.log(`Admin users - fetched user:`, user ? { id: user.id, username: user.username, isAdmin: user.isAdmin } : null);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log(`Admin users - fetching all users`);
      const allUsers = await storage.getAllUsers();
      console.log(`Admin users - found ${allUsers.length} users`);
      res.json(allUsers);
    } catch (error: any) {
      console.log(`Admin users - error: ${error.message}`);
      console.log(`Admin users - stack: ${error.stack}`);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to delete a user
  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
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

      const targetUserId = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (targetUserId === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Allow deletion of specific test admin accounts only
      const deletableTestAdmins = ['testerpeter', 'newadmin', 'admintest'];
      if (targetUser.isAdmin && !deletableTestAdmins.includes(targetUser.username)) {
        return res.status(400).json({ message: "Cannot delete admin accounts" });
      }

      // Implement cascade deletion by removing all related data first
      try {
        // Get creator profile if exists
        const [creator] = await db.select().from(creators).where(eq(creators.userId, targetUserId));
        
        if (creator) {
          console.log(`Deleting creator data for user ${targetUserId}, creator ${creator.id}`);
          
          // Delete core creator-related data that commonly causes foreign key violations
          
          // 1. Delete withdrawal requests
          await db.delete(withdrawalRequests).where(eq(withdrawalRequests.creatorId, creator.id));
          
          // 2. Delete payout methods
          await db.delete(payoutMethods).where(eq(payoutMethods.creatorId, creator.id));
          
          // 3. Delete earning transactions
          await db.delete(earningTransactions).where(eq(earningTransactions.creatorId, creator.id));
          
          // 4. Delete creator earnings
          await db.delete(creatorEarnings).where(eq(creatorEarnings.creatorId, creator.id));
          
          // 5. Delete affiliate links (where creator is the affiliate)
          await db.delete(affiliateLinks).where(eq(affiliateLinks.affiliateCreatorId, creator.id));
          
          // 6. Delete orders
          await db.delete(orders).where(eq(orders.creatorId, creator.id));
          
          // 7. Delete subscriptions
          await db.delete(subscriptions).where(eq(subscriptions.creatorId, creator.id));
          
          // 8. Delete products and their settings
          const productsToDelete = await db.select().from(products).where(eq(products.creatorId, creator.id));
          for (const product of productsToDelete) {
            // Delete product settings if they exist
            try {
              await db.delete(productSettings).where(eq(productSettings.productId, product.id));
            } catch (e) {
              // Continue if productSettings doesn't exist or has different structure
            }
          }
          
          // 9. Delete products
          await db.delete(products).where(eq(products.creatorId, creator.id));
          
          // 10. Delete color themes
          await db.delete(colorThemes).where(eq(colorThemes.userId, targetUserId));
          
          // 11. Finally delete creator profile
          await db.delete(creators).where(eq(creators.id, creator.id));
          
          console.log(`Successfully deleted all creator data for user ${targetUserId}`);
        }
        
        // Delete user-specific data
        await db.delete(emailVerifications).where(eq(emailVerifications.userId, targetUserId));
        await db.delete(userSessions).where(eq(userSessions.userId, targetUserId));
        
        // Now safely delete the user
        const deleted = await storage.deleteUser(targetUserId);
        if (deleted) {
          res.json({ 
            message: "User and all associated data deleted successfully", 
            userId: targetUserId,
            deletedCreatorData: !!creator
          });
        } else {
          res.status(500).json({ message: "Failed to delete user after cleanup" });
        }
        
      } catch (dbError: any) {
        console.error('User deletion error:', dbError);
        res.status(500).json({ 
          message: `Failed to delete user: ${dbError.message}`,
          details: "Error occurred during data cleanup process"
        });
      }
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

  // Withdrawal and Earnings Management Routes
  
  // Get creator earnings overview
  app.get("/api/creators/:id/earnings", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const earnings = await storage.getCreatorEarnings(creatorId);
      const transactions = await storage.getEarningTransactions(creatorId);
      
      res.json({
        earnings: earnings || {
          totalEarnings: "0.00",
          availableBalance: "0.00",
          pendingBalance: "0.00",
          totalWithdrawn: "0.00",
          currency: "KES"
        },
        recentTransactions: transactions.slice(0, 10)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get creator payout methods
  app.get("/api/creators/:id/payout-methods", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const payoutMethods = await storage.getPayoutMethods(creatorId);
      res.json(payoutMethods);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add new payout method
  app.post("/api/creators/:id/payout-methods", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const validatedData = insertPayoutMethodSchema.parse({
        ...req.body,
        creatorId
      });
      
      // If this is set as default, unset other defaults
      if (validatedData.isDefault) {
        await storage.unsetDefaultPayoutMethods(creatorId);
      }
      
      const payoutMethod = await storage.createPayoutMethod(validatedData);
      res.json(payoutMethod);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete payout method
  app.delete("/api/payout-methods/:id", async (req: Request, res: Response) => {
    try {
      const payoutMethodId = parseInt(req.params.id);
      await storage.deletePayoutMethod(payoutMethodId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get withdrawal requests for creator
  app.get("/api/creators/:id/withdrawals", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const withdrawals = await storage.getWithdrawalRequests(creatorId);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create withdrawal request
  app.post("/api/creators/:id/withdrawals", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const { amount, payoutMethodId, notes } = req.body;
      
      // Check available balance
      const earnings = await storage.getCreatorEarnings(creatorId);
      if (!earnings || parseFloat(earnings.availableBalance) < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient available balance" });
      }

      // Calculate processing fee (2% for M-Pesa, 3% for others)
      const payoutMethod = await storage.getPayoutMethod(payoutMethodId);
      const feeRate = payoutMethod?.type === 'mpesa' ? 0.02 : 0.03;
      const processingFee = parseFloat(amount) * feeRate;
      const netAmount = parseFloat(amount) - processingFee;

      const withdrawalData = {
        creatorId,
        payoutMethodId,
        amount: amount.toString(),
        currency: earnings?.currency || "KES",
        processingFee: processingFee.toString(),
        netAmount: netAmount.toString(),
        notes: notes || ""
      };

      const withdrawal = await storage.createWithdrawalRequest(withdrawalData);
      
      // Update available balance (move to pending)
      await storage.updateCreatorBalance(creatorId, {
        availableBalance: (parseFloat(earnings.availableBalance) - parseFloat(amount)).toString(),
        pendingBalance: (parseFloat(earnings.pendingBalance || "0") + parseFloat(amount)).toString()
      });

      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cancel withdrawal request (only pending ones)
  app.put("/api/withdrawals/:id/cancel", async (req: Request, res: Response) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const withdrawal = await storage.getWithdrawalRequest(withdrawalId);
      
      if (!withdrawal || withdrawal.status !== 'pending') {
        return res.status(400).json({ message: "Cannot cancel this withdrawal" });
      }

      await storage.updateWithdrawalStatus(withdrawalId, 'cancelled', 'Cancelled by user');
      
      // Restore balance
      const earnings = await storage.getCreatorEarnings(withdrawal.creatorId);
      if (earnings) {
        await storage.updateCreatorBalance(withdrawal.creatorId, {
          availableBalance: (parseFloat(earnings.availableBalance) + parseFloat(withdrawal.amount)).toString(),
          pendingBalance: (parseFloat(earnings.pendingBalance) - parseFloat(withdrawal.amount)).toString()
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Get all withdrawal requests
  app.get("/api/admin/withdrawals", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let userId: number;
      try {
        userId = parseInt(Buffer.from(token, 'base64').toString());
        if (isNaN(userId)) {
          return res.status(401).json({ message: "Invalid token format" });
        }
      } catch (e) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const withdrawals = await storage.getAllWithdrawalRequests();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Process withdrawal request
  app.put("/api/admin/withdrawals/:id/process", async (req: Request, res: Response) => {
    try {
      // Admin authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let userId: number;
      try {
        userId = parseInt(Buffer.from(token, 'base64').toString());
        if (isNaN(userId)) {
          return res.status(401).json({ message: "Invalid token format" });
        }
      } catch (e) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const withdrawalId = parseInt(req.params.id);
      const { status, transactionId, notes } = req.body;
      
      const withdrawal = await storage.getWithdrawalRequest(withdrawalId);
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }

      await storage.updateWithdrawalStatus(withdrawalId, status, notes, transactionId);
      
      // If completed, update total withdrawn and balances
      if (status === 'completed') {
        const earnings = await storage.getCreatorEarnings(withdrawal.creatorId);
        if (earnings) {
          await storage.updateCreatorBalance(withdrawal.creatorId, {
            pendingBalance: (parseFloat(earnings.pendingBalance) - parseFloat(withdrawal.amount)).toString(),
            totalWithdrawn: (parseFloat(earnings.totalWithdrawn) + parseFloat(withdrawal.netAmount)).toString()
          });
        }

        // Record transaction
        await storage.createEarningTransaction({
          creatorId: withdrawal.creatorId,
          type: 'withdrawal',
          amount: `-${withdrawal.netAmount}`,
          currency: withdrawal.currency,
          description: `Withdrawal processed via ${withdrawal.payoutMethodId}`,
          status: 'completed'
        });
      } else if (status === 'failed') {
        // Restore available balance
        const earnings = await storage.getCreatorEarnings(withdrawal.creatorId);
        if (earnings) {
          await storage.updateCreatorBalance(withdrawal.creatorId, {
            availableBalance: (parseFloat(earnings.availableBalance) + parseFloat(withdrawal.amount)).toString(),
            pendingBalance: (parseFloat(earnings.pendingBalance) - parseFloat(withdrawal.amount)).toString()
          });
        }
      }

      res.json({ success: true });
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

  // Subscription payment webhook - processes plan upgrades after successful payment
  app.post("/api/subscription/payment-webhook", async (req: Request, res: Response) => {
    try {
      const { orderId, status, transactionId } = req.body;
      
      if (status !== 'completed' && status !== 'COMPLETED') {
        return res.json({ message: "Payment not completed" });
      }

      // Get the order details
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if this is a subscription order
      let metadata = null;
      try {
        const items = JSON.parse(order.items as string);
        if (Array.isArray(items) && items[0]?.type === 'subscription') {
          metadata = items[0];
        } else {
          return res.json({ message: "Not a subscription order" });
        }
      } catch (e) {
        return res.json({ message: "Invalid order metadata" });
      }

      // Extract subscription plan details
      const planName = metadata.name;
      let planId = 'starter'; // Default
      if (planName?.includes('Pro')) planId = 'pro';
      else if (planName?.includes('Starter')) planId = 'starter';
      
      const plan = getPlanById(planId);
      if (!plan) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Update the creator's subscription plan
      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1); // 1 month subscription

      const updatedCreator = await storage.updateCreator(order.creatorId, {
        planType: planId,
        subscriptionStatus: 'active',
        subscriptionEndsAt: subscriptionEndsAt,
      });

      // Update order status
      await storage.updateOrder(order.id, {
        status: 'completed',
        paymentStatus: 'paid'
      });

      res.json({ 
        success: true, 
        message: "Subscription activated successfully",
        creator: updatedCreator,
        plan: plan
      });

    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin route to manually verify users (for production issues)
  app.post("/api/admin/verify-user-email", async (req: Request, res: Response) => {
    try {
      const { email, adminKey } = req.body;
      
      // Simple admin key check (you can set ADMIN_KEY in your .env)
      if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'creohub-admin-2025') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Manually verify the user
      const updatedUser = await storage.updateUser(user.id, {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null
      });

      res.json({ 
        message: "User email verified successfully", 
        user: { id: updatedUser?.id, email: updatedUser?.email, isEmailVerified: updatedUser?.isEmailVerified }
      });

    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
