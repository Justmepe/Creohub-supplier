import { 
  users, 
  creators, 
  products, 
  orders, 
  analytics,
  type User, 
  type InsertUser,
  type Creator,
  type InsertCreator,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Analytics,
  type InsertAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Creators
  getCreator(id: number): Promise<Creator | undefined>;
  getCreatorByUserId(userId: number): Promise<Creator | undefined>;
  getCreatorByHandle(handle: string): Promise<Creator | undefined>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: number, updates: Partial<Creator>): Promise<Creator | undefined>;
  getCreators(): Promise<Creator[]>;

  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCreator(creatorId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCreator(creatorId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;

  // Analytics
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByCreator(creatorId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private creators: Map<number, Creator>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private analytics: Map<number, Analytics>;
  private currentUserId: number;
  private currentCreatorId: number;
  private currentProductId: number;
  private currentOrderId: number;
  private currentAnalyticsId: number;

  constructor() {
    this.users = new Map();
    this.creators = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.analytics = new Map();
    this.currentUserId = 1;
    this.currentCreatorId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentAnalyticsId = 1;
    
    // Initialize with admin test account immediately
    this.initializeAdminAccount();
  }

  private initializeAdminAccount() {
    // Create admin test user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admintest",
      email: "admin@test.com",
      password: "admin123",
      fullName: null,
      bio: null,
      avatar: null,
      isCreator: false,
      isAdmin: true,
      role: 'admin',
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    
    console.log(`Admin user created: ${adminUser.username} with ID: ${adminUser.id}`);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      fullName: insertUser.fullName || null,
      bio: insertUser.bio || null,
      avatar: insertUser.avatar || null,
      isCreator: false,
      isAdmin: false,
      role: 'user',
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    // Also delete associated creator if exists
    const creator = await this.getCreatorByUserId(id);
    if (creator) {
      // Delete all products by this creator
      const products = await this.getProductsByCreator(creator.id);
      for (const product of products) {
        await this.deleteProduct(product.id);
      }
      
      // Delete creator
      this.creators.delete(creator.id);
    }

    // Delete user
    this.users.delete(id);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Creators
  async getCreator(id: number): Promise<Creator | undefined> {
    return this.creators.get(id);
  }

  async getCreatorByUserId(userId: number): Promise<Creator | undefined> {
    return Array.from(this.creators.values()).find(creator => creator.userId === userId);
  }

  async getCreatorByHandle(handle: string): Promise<Creator | undefined> {
    return Array.from(this.creators.values()).find(creator => creator.storeHandle === handle);
  }

  async createCreator(insertCreator: InsertCreator): Promise<Creator> {
    const id = this.currentCreatorId++;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30-day trial
    
    const creator: Creator = { 
      ...insertCreator, 
      id,
      storeDescription: insertCreator.storeDescription || null,
      storeTheme: insertCreator.storeTheme || "minimal",
      storeColors: insertCreator.storeColors || {},
      customDomain: insertCreator.customDomain || null,
      isActive: true,
      planType: "free",
      subscriptionStatus: "trial",
      trialEndsAt,
      subscriptionEndsAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      productCount: 0,
      createdAt: new Date() 
    };
    this.creators.set(id, creator);
    
    // Update user to be a creator
    await this.updateUser(insertCreator.userId, { isCreator: true });
    
    return creator;
  }

  async updateCreator(id: number, updates: Partial<Creator>): Promise<Creator | undefined> {
    const creator = this.creators.get(id);
    if (!creator) return undefined;
    
    const updatedCreator = { ...creator, ...updates };
    this.creators.set(id, updatedCreator);
    return updatedCreator;
  }

  async getCreators(): Promise<Creator[]> {
    return Array.from(this.creators.values());
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCreator(creatorId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.creatorId === creatorId);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id,
      description: insertProduct.description || null,
      category: insertProduct.category || null,
      digitalFile: insertProduct.digitalFile || null,
      stock: insertProduct.stock || null,
      currency: insertProduct.currency || "USD",
      images: insertProduct.images || [],
      isActive: true,
      createdAt: new Date() 
    };
    this.products.set(id, product);
    
    // Update creator's product count
    const creator = await this.getCreator(insertProduct.creatorId);
    if (creator) {
      await this.updateCreator(creator.id, { 
        productCount: (creator.productCount || 0) + 1 
      });
    }
    
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByCreator(creatorId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.creatorId === creatorId);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder, 
      id,
      customerName: insertOrder.customerName || null,
      customerPhone: insertOrder.customerPhone || null,
      currency: insertOrder.currency || "USD",
      paymentMethod: insertOrder.paymentMethod || null,
      paymentStatus: "pending",
      orderStatus: "processing",
      shippingAddress: insertOrder.shippingAddress || null,
      createdAt: new Date() 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...updates };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Analytics
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = this.currentAnalyticsId++;
    const analytics: Analytics = { 
      ...insertAnalytics, 
      id,
      productId: insertAnalytics.productId || null,
      eventData: insertAnalytics.eventData || {},
      createdAt: new Date() 
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  async getAnalyticsByCreator(creatorId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    let results = Array.from(this.analytics.values()).filter(analytics => analytics.creatorId === creatorId);
    
    if (startDate) {
      results = results.filter(analytics => analytics.createdAt >= startDate);
    }
    
    if (endDate) {
      results = results.filter(analytics => analytics.createdAt <= endDate);
    }
    
    return results;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return false;

    // Delete associated creator and their data if exists
    const creator = await this.getCreatorByUserId(id);
    if (creator) {
      // Delete ALL analytics records for this creator (including those with null product_id)
      await db.delete(analytics).where(eq(analytics.creatorId, creator.id));
      
      // Delete all orders for this creator
      await db.delete(orders).where(eq(orders.creatorId, creator.id));
      
      // Now delete products without worrying about analytics constraints
      await db.delete(products).where(eq(products.creatorId, creator.id));
      
      // Delete creator
      await db.delete(creators).where(eq(creators.id, creator.id));
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Creators
  async getCreator(id: number): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.id, id));
    return creator || undefined;
  }

  async getCreatorByUserId(userId: number): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.userId, userId));
    return creator || undefined;
  }

  async getCreatorByHandle(handle: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.storeHandle, handle));
    return creator || undefined;
  }

  async createCreator(insertCreator: InsertCreator): Promise<Creator> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30-day trial
    
    const [creator] = await db
      .insert(creators)
      .values({
        ...insertCreator,
        subscriptionStatus: "trial",
        trialEndsAt,
        productCount: 0
      })
      .returning();
    
    // Update user to be a creator
    await this.updateUser(insertCreator.userId, { isCreator: true });
    
    return creator;
  }

  async updateCreator(id: number, updates: Partial<Creator>): Promise<Creator | undefined> {
    const [creator] = await db
      .update(creators)
      .set(updates)
      .where(eq(creators.id, id))
      .returning();
    return creator || undefined;
  }

  async getCreators(): Promise<Creator[]> {
    return await db.select().from(creators);
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByCreator(creatorId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.creatorId, creatorId));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    
    // Update creator's product count
    const creator = await this.getCreator(insertProduct.creatorId);
    if (creator) {
      await this.updateCreator(creator.id, { 
        productCount: (creator.productCount || 0) + 1 
      });
    }
    
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    // Delete analytics records that reference this product
    await db.delete(analytics).where(eq(analytics.productId, id));
    
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return result.length > 0;
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByCreator(creatorId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.creatorId, creatorId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Analytics
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [analyticsRecord] = await db
      .insert(analytics)
      .values(insertAnalytics)
      .returning();
    return analyticsRecord;
  }

  async getAnalyticsByCreator(creatorId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    let query = db.select().from(analytics).where(eq(analytics.creatorId, creatorId));
    
    // Note: Date filtering would require additional imports and complex where conditions
    // For now, returning all analytics for the creator
    return await query;
  }
}

export const storage = new DatabaseStorage();
