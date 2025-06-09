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
  role: text("role").default("user"), // user, creator, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  storeHandle: text("store_handle").notNull().unique(),
  storeName: text("store_name").notNull(),
  storeDescription: text("store_description"),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  bio: true,
  avatar: true,
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

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  creatorId: true,
  productId: true,
  eventType: true,
  eventData: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
