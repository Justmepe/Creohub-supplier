import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

// Extend Express session interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}
import { storage } from "./storage";
import { getSocialProofData, addFakeUser, socialProofConfig } from "./services/socialProof";
import { sendEmail } from "./services/email";
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

      // For paid plans, create a subscription record
      const subscription = await storage.createSubscription({
        planType: planId,
        creatorId: creatorId,
        amount: plan.price.toString(),
        currency: 'USD',
        paymentMethod: 'pending',
        billingCycle: plan.billingCycle,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + (plan.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
        paymentReference: `sub_${Date.now()}_${creatorId}`,
        metadata: { planUpgrade: true }
      });

      res.json({ 
        success: true, 
        subscription: subscription,
        plan: plan,
        message: "Subscription created. Please complete payment to activate." 
      });

    } catch (error: any) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ message: "Failed to upgrade subscription" });
    }
  });

  app.get("/api/subscription/status/:creatorId", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      
      const creator = await storage.getCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const activeSubscription = await storage.getActiveSubscription(creatorId);
      const plan = getPlanById(creator.planType || 'free');

      res.json({
        creator: {
          id: creator.id,
          planType: creator.planType,
          subscriptionStatus: creator.subscriptionStatus,
          subscriptionEndsAt: creator.subscriptionEndsAt,
          trialStartedAt: creator.trialStartedAt
        },
        subscription: activeSubscription,
        plan: plan,
        isTrialExpired: isTrialExpired(creator),
        isSubscriptionActive: isSubscriptionActive(creator)
      });

    } catch (error: any) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // User registration and authentication
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Create user
      const user = await storage.createUser(userData);
      
      // Generate and send verification code
      const code = generateVerificationCode();
      await storage.createEmailVerification(user.id, code);
      
      try {
        await sendVerificationEmail(userData.email, userData.username || userData.email, code);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue registration even if email fails
      }

      res.status(201).json({
        message: "User registered successfully. Please check your email for verification code.",
        user: { id: user.id, email: user.email, username: user.username }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last active timestamp
      await storage.updateUser(user.id, { lastActiveAt: new Date() });

      // Create session
      const sessionId = await createUserSession(user.id);
      
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax'
      });

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

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const verification = await storage.getEmailVerification(user.id);
      if (!verification) {
        return res.status(400).json({ message: "No verification code found" });
      }

      if (verification.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (verification.expiresAt < new Date()) {
        return res.status(400).json({ message: "Verification code has expired" });
      }

      // Mark user as verified
      await storage.updateUser(user.id, { isEmailVerified: true });
      await storage.deleteEmailVerification(user.id);

      res.json({ message: "Email verified successfully" });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification code
      const code = generateVerificationCode();
      await storage.createEmailVerification(user.id, code);
      
      try {
        await sendVerificationEmail(email, user.username || email, code);
        res.json({ message: "Verification code sent successfully" });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification" });
    }
  });

  app.get("/api/auth/verification-status/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        isEmailVerified: user.isEmailVerified,
        email: user.email 
      });
    } catch (error: any) {
      console.error("Verification status error:", error);
      res.status(500).json({ message: "Failed to get verification status" });
    }
  });

  app.post("/api/auth/get-verification-code", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const verification = await storage.getEmailVerification(user.id);
      if (!verification) {
        return res.status(404).json({ message: "No verification code found" });
      }

      res.json({ 
        code: verification.code,
        expiresAt: verification.expiresAt
      });
    } catch (error: any) {
      console.error("Get verification code error:", error);
      res.status(500).json({ message: "Failed to get verification code" });
    }
  });

  // Session-based authentication middleware
  const requireAuth = async (req: any, res: Response, next: any) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = await validateSession(sessionId);
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Authentication failed" });
    }
  };

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: any, res: Response) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        fullName: req.user.fullName,
        isEmailVerified: req.user.isEmailVerified,
        isAdmin: req.user.isAdmin,
        role: req.user.role,
        lastActiveAt: req.user.lastActiveAt
      }
    });
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        await invalidateSession(sessionId);
      }
      
      res.clearCookie('sessionId');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // User management
  app.put("/api/users/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile, unless they're admin
      if (userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updateData = req.body;
      const updatedUser = await storage.updateUser(userId, updateData);
      
      res.json({ user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Creator management
  app.post("/api/creators", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorData = insertCreatorSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Check if user already has a creator profile
      const existingCreator = await storage.getCreatorByUserId(req.user.id);
      if (existingCreator) {
        return res.status(400).json({ message: "User already has a creator profile" });
      }

      const creator = await storage.createCreator(creatorData);
      
      // Update user to mark as creator
      await storage.updateUser(req.user.id, { isCreator: true });

      res.status(201).json({ creator });
    } catch (error: any) {
      console.error("Creator creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create creator profile" });
    }
  });

  app.get("/api/creators/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      res.json({ creator });
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

      res.json({ creator });
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

      res.json({ creator });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.get("/api/creators/:id/products", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const products = await storage.getProductsByCreator(creatorId);
      
      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.put("/api/creators/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updateData = req.body;
      const updatedCreator = await storage.updateCreator(creatorId, updateData);
      
      res.json({ creator: updatedCreator });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update creator" });
    }
  });

  // Creator file uploads
  app.post("/api/creators/:id/upload-logo", requireAuth, upload.single("logo"), async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const logoUrl = `/uploads/${req.file.filename}`;
      const updatedCreator = await storage.updateCreator(creatorId, { logoUrl });
      
      res.json({ logoUrl, creator: updatedCreator });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  app.post("/api/creators/:id/upload-banner", requireAuth, upload.single("banner"), async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const bannerUrl = `/uploads/${req.file.filename}`;
      const updatedCreator = await storage.updateCreator(creatorId, { bannerUrl });
      
      res.json({ bannerUrl, creator: updatedCreator });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });

  // Product management
  app.post("/api/products", requireAuth, upload.single("digitalFile"), async (req: any, res: Response) => {
    try {
      // Get creator profile for the user
      const creator = await storage.getCreatorByUserId(req.user.id);
      if (!creator) {
        return res.status(400).json({ message: "You must have a creator profile to add products" });
      }

      // Check plan limits
      const canAdd = await canAddProduct(creator);
      if (!canAdd.allowed) {
        return res.status(403).json({ message: canAdd.reason });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        creatorId: creator.id,
        digitalFileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });

      const product = await storage.createProduct(productData);
      res.status(201).json({ product });
    } catch (error: any) {
      console.error("Product creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create product" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ product });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Check if user owns this product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const creator = await storage.getCreator(product.creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updateData = req.body;
      const updatedProduct = await storage.updateProduct(productId, updateData);
      
      res.json({ product: updatedProduct });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Check if user owns this product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const creator = await storage.getCreator(product.creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Order management
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      res.status(201).json({ order });
    } catch (error: any) {
      console.error("Order creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ order });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/creators/:id/orders", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const orders = await storage.getOrdersByCreator(creatorId);
      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/creators/:id/subscriptions", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const subscriptions = await storage.getSubscriptionsByCreator(creatorId);
      res.json({ subscriptions });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.put("/api/orders/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Check if user owns this order's product
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const product = await storage.getProduct(order.productId || 0);
      if (product) {
        const creator = await storage.getCreator(product.creatorId);
        if (!creator || creator.userId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      const updatedOrder = await storage.updateOrder(orderId, updateData);
      res.json({ order: updatedOrder });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.get("/api/orders/customer", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      const orders = await storage.getOrdersByCustomerEmail(email);
      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  // Analytics
  app.post("/api/analytics", async (req: Request, res: Response) => {
    try {
      const analyticsData = insertAnalyticsSchema.parse(req.body);
      const analytics = await storage.createAnalytics(analyticsData);
      
      res.status(201).json({ analytics });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create analytics" });
    }
  });

  app.get("/api/creators/:id/analytics", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const analytics = await storage.getAnalyticsByCreator(creatorId);
      res.json({ analytics });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Payment configuration
  app.get("/api/payments/config", async (req: Request, res: Response) => {
    try {
      const { country } = req.query;
      const currency = detectCurrencyFromBrowser(req.headers['accept-language'] || '');
      
      res.json({
        availablePaymentMethods: [
          'pesapal',
          'mpesa',
          'stripe',
          'flutterwave',
          'bank_transfer'
        ],
        defaultCurrency: currency,
        supportedCountries: ['KE', 'UG', 'TZ', 'RW', 'NG', 'GH', 'ZA']
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch payment config" });
    }
  });

  // Affiliate system
  app.post("/api/affiliate/links", requireAuth, async (req: any, res: Response) => {
    try {
      const affiliateData = insertAffiliateLinkSchema.parse({
        ...req.body,
        affiliateId: req.user.id,
      });

      const affiliateLink = await storage.createAffiliateLink(affiliateData);
      res.status(201).json({ affiliateLink });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create affiliate link" });
    }
  });

  app.get("/api/affiliate/links", requireAuth, async (req: any, res: Response) => {
    try {
      const affiliateLinks = await storage.getAffiliateLinksByUser(req.user.id);
      res.json({ affiliateLinks });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch affiliate links" });
    }
  });

  app.post("/api/affiliate/click/:linkCode", async (req: Request, res: Response) => {
    try {
      const { linkCode } = req.params;
      const affiliateLink = await storage.getAffiliateLinkByCode(linkCode);
      
      if (!affiliateLink) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }

      // Track click
      await storage.updateAffiliateLink(affiliateLink.id, {
        clicks: (affiliateLink.clicks || 0) + 1,
      });

      res.json({ productId: affiliateLink.productId });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to process affiliate click" });
    }
  });

  app.get("/api/affiliate/commissions", requireAuth, async (req: any, res: Response) => {
    try {
      const commissions = await storage.getCommissionsByAffiliate(req.user.id);
      res.json({ commissions });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  // Product affiliate settings
  app.get("/api/products/:id/affiliate-settings", requireAuth, async (req: any, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Check if user owns this product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const creator = await storage.getCreator(product.creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const settings = await storage.getProductSettings(productId);
      res.json({ settings });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch affiliate settings" });
    }
  });

  app.put("/api/products/:id/affiliate-settings", requireAuth, async (req: any, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Check if user owns this product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const creator = await storage.getCreator(product.creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const settingsData = insertProductSettingsSchema.parse({
        productId,
        ...req.body,
      });

      const settings = await storage.updateProductSettings(productId, settingsData);
      res.json({ settings });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update affiliate settings" });
    }
  });

  app.get("/api/products/:id/affiliate-links", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const affiliateLinks = await storage.getAffiliateLinksByProduct(productId);
      res.json({ affiliateLinks });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch affiliate links" });
    }
  });

  // Color themes
  app.get("/api/themes", async (req: Request, res: Response) => {
    try {
      const themes = await storage.getAllColorThemes();
      res.json({ themes });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  app.get("/api/themes/active", async (req: Request, res: Response) => {
    try {
      const activeTheme = await storage.getActiveColorTheme();
      res.json({ theme: activeTheme });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch active theme" });
    }
  });

  app.post("/api/themes", requireAuth, async (req: any, res: Response) => {
    try {
      // Only admins can create themes for now
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const themeData = insertColorThemeSchema.parse(req.body);
      const theme = await storage.createColorTheme(themeData);
      res.status(201).json({ theme });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create theme" });
    }
  });

  app.put("/api/themes/:id", requireAuth, async (req: any, res: Response) => {
    try {
      // Only admins can edit themes for now
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const themeId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedTheme = await storage.updateColorTheme(themeId, updateData);
      res.json({ theme: updatedTheme });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  app.delete("/api/themes/:id", requireAuth, async (req: any, res: Response) => {
    try {
      // Only admins can delete themes for now
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const themeId = parseInt(req.params.id);
      await storage.deleteColorTheme(themeId);
      res.json({ message: "Theme deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete theme" });
    }
  });

  app.post("/api/themes/:id/activate", requireAuth, async (req: any, res: Response) => {
    try {
      // Only admins can activate themes for now
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const themeId = parseInt(req.params.id);
      
      // Deactivate all themes first
      await storage.deactivateAllColorThemes();
      
      // Activate the selected theme
      const activatedTheme = await storage.updateColorTheme(themeId, { isActive: true });
      res.json({ theme: activatedTheme });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to activate theme" });
    }
  });

  // Payment routes for different gateways
  
  // M-Pesa payments
  app.post("/api/payments/customer/mpesa", async (req: Request, res: Response) => {
    try {
      const { initiateMpesaPayment } = await import("./payments/mpesa");
      await initiateMpesaPayment(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "M-Pesa payment service unavailable" });
    }
  });

  app.get("/api/payments/customer/mpesa/status/:checkoutRequestId", async (req: Request, res: Response) => {
    try {
      const { checkMpesaStatus } = await import("./payments/mpesa");
      await checkMpesaStatus(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "M-Pesa status service unavailable" });
    }
  });

  app.post("/api/payments/customer/mpesa/callback", async (req: Request, res: Response) => {
    try {
      const { mpesaCallback } = await import("./payments/mpesa");
      await mpesaCallback(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "M-Pesa callback service unavailable" });
    }
  });

  // Stripe payments
  app.post("/api/payments/customer/stripe/payment-intent", async (req: Request, res: Response) => {
    try {
      const { createStripePaymentIntent } = await import("./payments/stripe");
      await createStripePaymentIntent(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Stripe payment service unavailable" });
    }
  });

  app.post("/api/payments/customer/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const { stripeWebhook } = await import("./payments/stripe");
      await stripeWebhook(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Stripe webhook service unavailable" });
    }
  });

  // Flutterwave payments
  app.post("/api/payments/customer/flutterwave", async (req: Request, res: Response) => {
    try {
      const { initiateFlutterwavePayment } = await import("./payments/flutterwave");
      await initiateFlutterwavePayment(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Flutterwave payment service unavailable" });
    }
  });

  app.get("/api/payments/customer/flutterwave/verify/:transactionId", async (req: Request, res: Response) => {
    try {
      const { verifyFlutterwavePayment } = await import("./payments/flutterwave");
      await verifyFlutterwavePayment(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Flutterwave verification service unavailable" });
    }
  });

  app.post("/api/payments/customer/flutterwave/webhook", async (req: Request, res: Response) => {
    try {
      const { flutterwaveWebhook } = await import("./payments/flutterwave");
      await flutterwaveWebhook(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Flutterwave webhook service unavailable" });
    }
  });

  // Bank information
  app.get("/api/payments/banks/:country?", async (req: Request, res: Response) => {
    try {
      const { getBankList } = await import("./payments/banks");
      await getBankList(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Bank service unavailable" });
    }
  });

  // Creator subscription payments
  app.post("/api/payments/creator/subscription", requireAuth, async (req: any, res: Response) => {
    try {
      const { processCreatorSubscription } = await import("./payments/subscription");
      req.user = req.user; // Pass user context
      await processCreatorSubscription(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Subscription payment service unavailable" });
    }
  });

  app.post("/api/payments/creator/stripe/customer", requireAuth, async (req: any, res: Response) => {
    try {
      const { createStripeCustomer } = await import("./payments/stripe");
      await createStripeCustomer(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Stripe customer service unavailable" });
    }
  });

  // Bank transfer payments
  app.post("/api/payments/bank-transfer", async (req: Request, res: Response) => {
    try {
      const { initiateBankTransfer } = await import("./payments/bankTransfer");
      await initiateBankTransfer(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Bank transfer service unavailable" });
    }
  });

  app.get("/api/payments/bank-accounts", async (req: Request, res: Response) => {
    try {
      const { getBankAccounts } = await import("./payments/bankTransfer");
      await getBankAccounts(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Bank accounts service unavailable" });
    }
  });

  app.post("/api/payments/bank-transfer/:transferId/verify", async (req: Request, res: Response) => {
    try {
      const { verifyBankTransfer } = await import("./payments/bankTransfer");
      await verifyBankTransfer(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Bank transfer verification service unavailable" });
    }
  });

  app.post("/api/payments/bank-transfer/webhook", async (req: Request, res: Response) => {
    try {
      const { bankTransferWebhook } = await import("./payments/bankTransfer");
      await bankTransferWebhook(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Bank transfer webhook service unavailable" });
    }
  });

  // Pesapal payments (primary gateway for Africa)
  app.post("/api/payments/customer/pesapal", async (req: Request, res: Response) => {
    try {
      const { initiatePesapalPayment } = await import("./payments/pesapal");
      await initiatePesapalPayment(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Pesapal payment service unavailable" });
    }
  });

  app.get("/api/payments/customer/pesapal/status/:orderTrackingId", async (req: Request, res: Response) => {
    try {
      const { checkPesapalStatus } = await import("./payments/pesapal");
      await checkPesapalStatus(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Pesapal status service unavailable" });
    }
  });

  app.get("/api/payments/customer/pesapal/ipn", async (req: Request, res: Response) => {
    try {
      const { pesapalIPN } = await import("./payments/pesapal");
      await pesapalIPN(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Pesapal IPN service unavailable" });
    }
  });

  app.get("/api/payments/customer/pesapal/callback", async (req: Request, res: Response) => {
    try {
      const { pesapalCallback } = await import("./payments/pesapal");
      await pesapalCallback(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Pesapal callback service unavailable" });
    }
  });

  // ADMIN ROUTES (for platform management)
  app.get("/api/admin/dashboard", async (req: Request, res: Response) => {
    try {
      // Basic admin check - you may want to implement proper admin authentication
      const adminStats = {
        totalUsers: await storage.getTotalUsers(),
        totalCreators: await storage.getTotalCreators(),
        totalProducts: await storage.getTotalProducts(),
        totalOrders: await storage.getTotalOrders(),
        totalRevenue: await storage.getTotalRevenue(),
        recentActivity: await storage.getRecentActivity(),
      };

      res.json(adminStats);
    } catch (error: any) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard data" });
    }
  });

  app.get("/api/admin/creators", async (req: Request, res: Response) => {
    try {
      const creators = await storage.getAllCreators();
      res.json({ creators });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch creators" });
    }
  });

  app.put("/api/admin/creators/:id", async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedCreator = await storage.updateCreator(creatorId, updateData);
      res.json({ creator: updatedCreator });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update creator" });
    }
  });

  app.post("/api/admin/promote-user", async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ message: "User ID and role are required" });
      }

      const updatedUser = await storage.updateUser(userId, { 
        role: role,
        isAdmin: role === 'admin'
      });
      
      res.json({ 
        success: true, 
        user: updatedUser,
        message: `User promoted to ${role}` 
      });
    } catch (error: any) {
      console.error("User promotion error:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
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

  // Debug route for checking users
  app.get("/api/debug/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ 
        count: users.length,
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          username: u.username,
          isAdmin: u.isAdmin,
          role: u.role,
          isEmailVerified: u.isEmailVerified
        }))
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch users for debug" });
    }
  });

  // Admin registration (for initial setup)
  app.post("/api/admin/register", async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ message: "Email, password, and username are required" });
      }

      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin user already exists with this email" });
      }

      // Create admin user
      const adminUser = await storage.createUser({
        email,
        password,
        username,
        isAdmin: true,
        isEmailVerified: true,
        role: 'admin'
      });

      res.status(201).json({
        message: "Admin user created successfully",
        user: {
          id: adminUser.id,
          email: adminUser.email,
          username: adminUser.username,
          isAdmin: adminUser.isAdmin,
          role: adminUser.role
        }
      });
    } catch (error: any) {
      console.error("Admin registration error:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Admin setup check
  app.post("/api/admin/setup", async (req: Request, res: Response) => {
    try {
      const { setupCode } = req.body;
      
      // Simple setup verification - you might want something more secure
      if (setupCode !== "CREOHUB_ADMIN_2024") {
        return res.status(401).json({ message: "Invalid setup code" });
      }

      res.json({ 
        message: "Setup code verified",
        canProceed: true 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Setup verification failed" });
    }
  });

  // Create test account for demo purposes
  app.post("/api/admin/create-test-account", async (req: Request, res: Response) => {
    try {
      const testUser = await storage.createUser({
        email: "test@creohub.io",
        password: "testpass123",
        username: "testuser",
        fullName: "Test User",
        isEmailVerified: true,
        isCreator: true
      });

      const testCreator = await storage.createCreator({
        userId: testUser.id,
        handle: "testcreator",
        displayName: "Test Creator",
        bio: "This is a test creator account for demonstration purposes.",
        planType: "pro",
        subscriptionStatus: "active"
      });

      res.json({
        message: "Test account created successfully",
        credentials: {
          email: "test@creohub.io",
          password: "testpass123"
        },
        user: testUser,
        creator: testCreator
      });
    } catch (error: any) {
      console.error("Test account creation error:", error);
      res.status(500).json({ message: "Failed to create test account" });
    }
  });

  // Creator earnings and payouts
  app.get("/api/creators/:id/earnings", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const earnings = await storage.getCreatorEarnings(creatorId);
      const transactions = await storage.getEarningTransactions(creatorId);
      
      res.json({ earnings, transactions });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  app.get("/api/creators/:id/payout-methods", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const payoutMethods = await storage.getPayoutMethods(creatorId);
      res.json({ payoutMethods });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch payout methods" });
    }
  });

  app.post("/api/creators/:id/payout-methods", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const payoutMethodData = insertPayoutMethodSchema.parse({
        ...req.body,
        creatorId,
      });

      const payoutMethod = await storage.createPayoutMethod(payoutMethodData);
      res.status(201).json({ payoutMethod });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create payout method" });
    }
  });

  app.delete("/api/payout-methods/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const payoutMethodId = parseInt(req.params.id);
      
      // Check if user owns this payout method
      const payoutMethod = await storage.getPayoutMethod(payoutMethodId);
      if (!payoutMethod) {
        return res.status(404).json({ message: "Payout method not found" });
      }

      const creator = await storage.getCreator(payoutMethod.creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deletePayoutMethod(payoutMethodId);
      res.json({ message: "Payout method deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete payout method" });
    }
  });

  app.get("/api/creators/:id/withdrawals", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const withdrawals = await storage.getWithdrawalRequests(creatorId);
      res.json({ withdrawals });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.post("/api/creators/:id/withdrawals", requireAuth, async (req: any, res: Response) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      // Check if user owns this creator profile
      const creator = await storage.getCreator(creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const withdrawalData = insertWithdrawalRequestSchema.parse({
        ...req.body,
        creatorId,
      });

      // Check if creator has sufficient balance
      const earnings = await storage.getCreatorEarnings(creatorId);
      if (!earnings || parseFloat(earnings.availableBalance) < parseFloat(withdrawalData.amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const withdrawal = await storage.createWithdrawalRequest(withdrawalData);
      
      // Create earning transaction
      await storage.createEarningTransaction({
        creatorId,
        type: 'withdrawal_request',
        amount: withdrawalData.amount,
        description: `Withdrawal request #${withdrawal.id}`,
        metadata: { withdrawalId: withdrawal.id }
      });

      res.status(201).json({ withdrawal });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create withdrawal request" });
    }
  });

  app.put("/api/withdrawals/:id/cancel", requireAuth, async (req: any, res: Response) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      
      // Check if user owns this withdrawal
      const withdrawal = await storage.getWithdrawalRequest(withdrawalId);
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }

      const creator = await storage.getCreator(withdrawal.creatorId);
      if (!creator || creator.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ message: "Only pending withdrawals can be cancelled" });
      }

      const updatedWithdrawal = await storage.updateWithdrawalRequest(withdrawalId, {
        status: 'cancelled',
      });

      res.json({ withdrawal: updatedWithdrawal });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to cancel withdrawal" });
    }
  });

  // Admin withdrawal management
  app.get("/api/admin/withdrawals", async (req: Request, res: Response) => {
    try {
      const withdrawals = await storage.getAllWithdrawalRequests();
      res.json({ withdrawals });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.put("/api/admin/withdrawals/:id/process", async (req: Request, res: Response) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      const withdrawal = await storage.getWithdrawalRequest(withdrawalId);
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }

      const updatedWithdrawal = await storage.updateWithdrawalRequest(withdrawalId, {
        status,
        adminNotes,
        processedAt: new Date(),
      });

      // Create earning transaction based on status
      const transactionType = status === 'approved' ? 'withdrawal_approved' : 'withdrawal_rejected';
      await storage.createEarningTransaction({
        creatorId: withdrawal.creatorId,
        type: transactionType,
        amount: withdrawal.amount,
        description: `Withdrawal ${status} by admin`,
        metadata: { 
          withdrawalId: withdrawal.id,
          adminNotes 
        }
      });

      res.json({ withdrawal: updatedWithdrawal });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Stripe subscription payments  
  app.post("/api/payments/stripe", async (req: Request, res: Response) => {
    try {
      const { createStripePaymentIntent } = await import("./payments/stripe");
      await createStripePaymentIntent(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Stripe payment service unavailable" });
    }
  });

  // Subscription payment webhook
  app.post("/api/subscription/payment-webhook", async (req: Request, res: Response) => {
    try {
      const { processSubscriptionWebhook } = await import("./payments/subscription");
      await processSubscriptionWebhook(req, res);
    } catch (error: any) {
      res.status(500).json({ message: "Subscription webhook service unavailable" });
    }
  });

  // Admin email verification override
  app.post("/api/admin/verify-user-email", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, { 
        isEmailVerified: true 
      });
      
      // Clean up any pending verification
      await storage.deleteEmailVerification(userId);
      
      res.json({ 
        success: true, 
        user: updatedUser,
        message: "User email verified by admin" 
      });
    } catch (error: any) {
      console.error("Admin email verification error:", error);
      res.status(500).json({ message: "Failed to verify user email" });
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

  app.post("/api/admin/social-proof/add-fake", async (req: Request, res: Response) => {
    try {
      const { name, location, action, productName } = req.body;
      
      if (!name || !location || !action) {
        return res.status(400).json({ message: "Name, location, and action are required" });
      }

      const fakeUser = await addFakeUser({ name, location, action, productName });
      res.json({ 
        success: true, 
        user: fakeUser,
        message: "Fake user added for social proof" 
      });
    } catch (error: any) {
      console.error("Add fake user error:", error);
      res.status(500).json({ message: "Failed to add fake user" });
    }
  });

  app.put("/api/admin/social-proof/config", async (req: Request, res: Response) => {
    try {
      const { showFakeUsers, maxEntries, refreshInterval } = req.body;
      
      socialProofConfig.showFakeUsers = showFakeUsers ?? socialProofConfig.showFakeUsers;
      socialProofConfig.maxEntries = maxEntries ?? socialProofConfig.maxEntries;
      socialProofConfig.refreshInterval = refreshInterval ?? socialProofConfig.refreshInterval;
      
      res.json({ 
        success: true, 
        config: socialProofConfig,
        message: "Social proof configuration updated" 
      });
    } catch (error: any) {
      console.error("Social proof config error:", error);
      res.status(500).json({ message: "Failed to update social proof configuration" });
    }
  });

  // Intelligent chatbot endpoint
  app.post("/api/chatbot/ask", async (req: Request, res: Response) => {
    try {
      const { intelligentChatbot } = await import("./services/intelligentChatbot");
      await intelligentChatbot(req, res);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(500).json({ 
        message: "I'm temporarily unavailable. Please try again later or contact support.",
        error: true 
      });
    }
  });

  // Contact form submission
  app.post("/api/contact/submit", async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          message: "All fields are required" 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: "Please provide a valid email address" 
        });
      }

      // Send email to support
      const emailContent = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `;

      const emailSent = await sendEmail(
        "support@creohub.io",
        "New Contact Form Submission",
        emailContent
      );

      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Thank you for contacting us! We'll get back to you soon." 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send your message. Please try again later." 
        });
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      res.status(500).json({ 
        message: "An error occurred while sending your message. Please try again later." 
      });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Serve the frontend
  app.use(express.static("server/public"));
  
  // Handle client-side routing
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "server/public/index.html"));
  });

  const httpServer = createServer(app);
  return httpServer;
}