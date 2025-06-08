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

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

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
      isCreator: false,
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
      currency: insertProduct.currency || "KES",
      images: insertProduct.images || [],
      isActive: true,
      createdAt: new Date() 
    };
    this.products.set(id, product);
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
      currency: insertOrder.currency || "KES",
      paymentStatus: "pending",
      orderStatus: "processing",
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

export const storage = new MemStorage();
