import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  bio: text("bio"),
  avatar: text("avatar"),
  isCreator: boolean("is_creator").default(false),
  isAdmin: boolean("is_admin").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  role: text("role").default("user"), // user, creator, admin
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(), // registration, password_reset, email_change
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  storeHandle: text("store_handle").notNull().unique(),
  storeName: text("store_name").notNull(),
  storeDescription: text("store_description"),
  storeLogo: text("store_logo"), // URL to uploaded logo image
  storeBanner: text("store_banner"), // URL to uploaded banner image
  storeTheme: text("store_theme").default("minimal"),
  storeColors: jsonb("store_colors").default({}),
  customDomain: text("custom_domain"),
  isActive: boolean("is_active").default(true),
  planType: text("plan_type").default("free"), // free, starter, pro
  subscriptionStatus: text("subscription_status").default("trial"), // trial, active, cancelled, expired
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  productCount: integer("product_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KES"),
  type: text("type").notNull(), // digital, physical, service, booking
  category: text("category"),
  images: jsonb("images").default([]),
  digitalFile: text("digital_file"), // file path for digital products
  isActive: boolean("is_active").default(true),
  stock: integer("stock"), // null for unlimited
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KES"),
  paymentMethod: text("payment_method"), // mpesa, paypal, stripe
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  orderStatus: text("order_status").default("processing"), // processing, shipped, delivered, cancelled
  items: jsonb("items").notNull(), // array of order items
  shippingAddress: jsonb("shipping_address"),
  affiliateLinkId: integer("affiliate_link_id").references(() => affiliateLinks.id), // tracks affiliate referral
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  planType: text("plan_type").notNull(), // starter, pro
  billingCycle: text("billing_cycle").default("monthly"), // monthly, yearly
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  paymentMethod: text("payment_method"), // pesapal, stripe, paypal
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  subscriptionStatus: text("subscription_status").default("active"), // active, cancelled, expired
  startsAt: timestamp("starts_at").defaultNow(),
  endsAt: timestamp("ends_at"),
  paymentReference: text("payment_reference"), // external payment ID
  metadata: jsonb("metadata").default({}), // additional payment data
  createdAt: timestamp("created_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  eventType: text("event_type").notNull(), // view, purchase, click
  eventData: jsonb("event_data").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  affiliateCreatorId: integer("affiliate_creator_id").references(() => creators.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  linkCode: text("link_code").notNull().unique(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // percentage
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  affiliateCreatorId: integer("affiliate_creator_id").references(() => creators.id).notNull(),
  originalCreatorId: integer("original_creator_id").references(() => creators.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  affiliateLinkId: integer("affiliate_link_id").references(() => affiliateLinks.id).notNull(),
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, paid, cancelled
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productSettings = pgTable("product_settings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull().unique(),
  allowAffiliates: boolean("allow_affiliates").default(true),
  defaultCommissionRate: decimal("default_commission_rate", { precision: 5, scale: 2 }).default("15.00"),
  minCommissionRate: decimal("min_commission_rate", { precision: 5, scale: 2 }).default("5.00"),
  maxCommissionRate: decimal("max_commission_rate", { precision: 5, scale: 2 }).default("50.00"),
  affiliateGuidelines: text("affiliate_guidelines"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const colorThemes = pgTable("color_themes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(false),
  colors: jsonb("colors").notNull(), // stores color palette
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creatorEarnings = pgTable("creator_earnings", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).default("0.00"),
  availableBalance: decimal("available_balance", { precision: 12, scale: 2 }).default("0.00"),
  pendingBalance: decimal("pending_balance", { precision: 12, scale: 2 }).default("0.00"),
  totalWithdrawn: decimal("total_withdrawn", { precision: 12, scale: 2 }).default("0.00"),
  currency: text("currency").default("KES"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const payoutMethods = pgTable("payout_methods", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  type: text("type").notNull(), // mpesa, bank_transfer, paypal, stripe
  accountDetails: jsonb("account_details").notNull(), // stores encrypted account info
  accountName: text("account_name").notNull(),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  payoutMethodId: integer("payout_method_id").references(() => payoutMethods.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KES"),
  status: text("status").default("pending"), // pending, processing, completed, failed, cancelled
  processingFee: decimal("processing_fee", { precision: 8, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  transactionId: text("transaction_id"),
  notes: text("notes"),
  processedAt: timestamp("processed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const earningTransactions = pgTable("earning_transactions", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  commissionId: integer("commission_id").references(() => commissions.id),
  type: text("type").notNull(), // sale, commission, withdrawal, fee, refund
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KES"),
  description: text("description").notNull(),
  status: text("status").default("completed"), // pending, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  bio: true,
  avatar: true,
  isAdmin: true,
  role: true,
  isCreator: true,
  isEmailVerified: true,
});

export const insertCreatorSchema = createInsertSchema(creators).pick({
  userId: true,
  storeHandle: true,
  storeName: true,
  storeDescription: true,
  storeTheme: true,
  storeColors: true,
  customDomain: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  creatorId: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  type: true,
  category: true,
  images: true,
  digitalFile: true,
  stock: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  creatorId: true,
  customerEmail: true,
  customerName: true,
  customerPhone: true,
  totalAmount: true,
  currency: true,
  paymentMethod: true,
  items: true,
  shippingAddress: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  creatorId: true,
  planType: true,
  billingCycle: true,
  amount: true,
  currency: true,
  paymentMethod: true,
  startsAt: true,
  endsAt: true,
  paymentReference: true,
  metadata: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  creatorId: true,
  productId: true,
  eventType: true,
  eventData: true,
});

export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).pick({
  affiliateCreatorId: true,
  productId: true,
  linkCode: true,
  commissionRate: true,
});

export const insertCommissionSchema = createInsertSchema(commissions).pick({
  affiliateCreatorId: true,
  originalCreatorId: true,
  productId: true,
  orderId: true,
  affiliateLinkId: true,
  saleAmount: true,
  commissionAmount: true,
  commissionRate: true,
});

export const insertPayoutMethodSchema = createInsertSchema(payoutMethods).pick({
  creatorId: true,
  type: true,
  accountDetails: true,
  accountName: true,
  isDefault: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).pick({
  creatorId: true,
  payoutMethodId: true,
  amount: true,
  currency: true,
  netAmount: true,
  notes: true,
});

export const insertEarningTransactionSchema = createInsertSchema(earningTransactions).pick({
  creatorId: true,
  orderId: true,
  commissionId: true,
  type: true,
  amount: true,
  currency: true,
  description: true,
});

export const insertProductSettingsSchema = createInsertSchema(productSettings).pick({
  productId: true,
  allowAffiliates: true,
  defaultCommissionRate: true,
  minCommissionRate: true,
  maxCommissionRate: true,
  affiliateGuidelines: true,
});

export const insertColorThemeSchema = createInsertSchema(colorThemes).pick({
  userId: true,
  name: true,
  isActive: true,
  colors: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export type ProductSettings = typeof productSettings.$inferSelect;
export type InsertProductSettings = z.infer<typeof insertProductSettingsSchema>;

export type ColorTheme = typeof colorThemes.$inferSelect;
export type InsertColorTheme = z.infer<typeof insertColorThemeSchema>;

export type CreatorEarnings = typeof creatorEarnings.$inferSelect;
export type PayoutMethod = typeof payoutMethods.$inferSelect;
export type InsertPayoutMethod = z.infer<typeof insertPayoutMethodSchema>;

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

export type EarningTransaction = typeof earningTransactions.$inferSelect;
export type InsertEarningTransaction = z.infer<typeof insertEarningTransactionSchema>;

// Email verification schemas
export const insertEmailVerificationSchema = createInsertSchema(emailVerifications);
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;

// User session schemas
export const insertUserSessionSchema = createInsertSchema(userSessions);
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
