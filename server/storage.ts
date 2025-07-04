import { 
  users, 
  creators, 
  products, 
  orders, 
  subscriptions,
  analytics,
  affiliateLinks,
  commissions,
  productSettings,
  colorThemes,
  creatorEarnings,
  payoutMethods,
  withdrawalRequests,
  earningTransactions,
  dropshippingPartners,
  dropshippingProducts,
  productSyncLogs,
  type User, 
  type InsertUser,
  type Creator,
  type InsertCreator,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Subscription,
  type InsertSubscription,
  type Analytics,
  type InsertAnalytics,
  type AffiliateLink,
  type InsertAffiliateLink,
  type Commission,
  type InsertCommission,
  type ProductSettings,
  type InsertProductSettings,
  type ColorTheme,
  type InsertColorTheme,
  type CreatorEarnings,
  type PayoutMethod,
  type InsertPayoutMethod,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type EarningTransaction,
  type InsertEarningTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  authenticateUser(email: string, password: string): Promise<User | undefined>;
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
  getAllCreators(): Promise<Creator[]>;

  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCreator(creatorId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCreator(creatorId: number): Promise<Order[]>;
  getOrdersByCustomerEmail(email: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;

  // Subscriptions
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionsByCreator(creatorId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Analytics
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByCreator(creatorId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]>;

  // Affiliate Links
  createAffiliateLink(affiliateLink: InsertAffiliateLink): Promise<AffiliateLink>;
  getAffiliateLinkByCode(linkCode: string): Promise<AffiliateLink | undefined>;
  getAffiliateLinksByCreator(creatorId: number): Promise<AffiliateLink[]>;
  getAffiliateLinksByProduct(productId: number): Promise<AffiliateLink[]>;
  updateAffiliateLinkClicks(linkId: number): Promise<void>;
  updateAffiliateLinkConversions(linkId: number): Promise<void>;

  // Commissions
  createCommission(commission: InsertCommission): Promise<Commission>;
  getCommissionsByAffiliate(affiliateCreatorId: number): Promise<Commission[]>;
  getCommissionsByCreator(originalCreatorId: number): Promise<Commission[]>;
  updateCommissionStatus(commissionId: number, status: string, paidAt?: Date): Promise<void>;

  // Product Settings
  createProductSettings(settings: InsertProductSettings): Promise<ProductSettings>;
  getProductSettings(productId: number): Promise<ProductSettings | undefined>;
  updateProductSettings(productId: number, updates: Partial<ProductSettings>): Promise<ProductSettings | undefined>;

  // Color Themes
  createColorTheme(theme: InsertColorTheme): Promise<ColorTheme>;
  getColorThemes(userId: number): Promise<ColorTheme[]>;
  getActiveColorTheme(userId: number): Promise<ColorTheme | undefined>;
  updateColorTheme(id: number, updates: Partial<ColorTheme>): Promise<ColorTheme | undefined>;
  deleteColorTheme(id: number): Promise<boolean>;
  setActiveTheme(userId: number, themeId: number): Promise<void>;

  // Creator Earnings
  getCreatorEarnings(creatorId: number): Promise<CreatorEarnings | undefined>;
  updateCreatorBalance(creatorId: number, updates: Partial<CreatorEarnings>): Promise<void>;
  createEarningTransaction(transaction: InsertEarningTransaction): Promise<EarningTransaction>;
  getEarningTransactions(creatorId: number): Promise<EarningTransaction[]>;

  // Payout Methods
  getPayoutMethods(creatorId: number): Promise<PayoutMethod[]>;
  getPayoutMethod(id: number): Promise<PayoutMethod | undefined>;
  createPayoutMethod(method: InsertPayoutMethod): Promise<PayoutMethod>;
  deletePayoutMethod(id: number): Promise<boolean>;
  unsetDefaultPayoutMethods(creatorId: number): Promise<void>;

  // Withdrawal Requests
  getWithdrawalRequests(creatorId: number): Promise<WithdrawalRequest[]>;
  getWithdrawalRequest(id: number): Promise<WithdrawalRequest | undefined>;
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  updateWithdrawalStatus(id: number, status: string, notes?: string, transactionId?: string): Promise<void>;
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;

  // Customer orders by email
  getOrdersByCustomerEmail(email: string): Promise<Order[]>;

  // Dropshipping Partners
  createDropshippingPartner(partner: any): Promise<any>;
  getDropshippingPartners(): Promise<any[]>;
  getDropshippingPartner(id: number): Promise<any>;
  updateDropshippingPartner(id: number, updates: any): Promise<any>;
  approveDropshippingPartner(id: number, approvedBy: number): Promise<any>;

  // Dropshipping Products
  createDropshippingProduct(product: any): Promise<any>;
  getDropshippingProducts(): Promise<any[]>;
  getDropshippingProductsByPartner(partnerId: number): Promise<any[]>;
  getDropshippingProductByExternalId(partnerId: number, externalId: string): Promise<any>;
  updateDropshippingProduct(id: number, updates: any): Promise<any>;

  // Product Sync Logs
  createProductSyncLog(log: any): Promise<any>;
  getProductSyncLogs(partnerId: number): Promise<any[]>;
  updateProductSyncLog(id: number, updates: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private creators: Map<number, Creator>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private subscriptions: Map<number, Subscription>;
  private analytics: Map<number, Analytics>;
  private affiliateLinks: Map<number, AffiliateLink>;
  private commissions: Map<number, Commission>;
  private productSettings: Map<number, ProductSettings>;
  private colorThemes: Map<number, ColorTheme>;
  private creatorEarnings: Map<number, CreatorEarnings>;
  private earningTransactions: Map<number, EarningTransaction>;
  private payoutMethods: Map<number, PayoutMethod>;
  private withdrawalRequests: Map<number, WithdrawalRequest>;
  private dropshippingPartners: Map<number, any>;
  private dropshippingProducts: Map<number, any>;
  private productSyncLogs: Map<number, any>;
  private currentUserId: number;
  private currentCreatorId: number;
  private currentProductId: number;
  private currentOrderId: number;
  private currentSubscriptionId: number;
  private currentAnalyticsId: number;
  private currentAffiliateLinkId: number;
  private currentCommissionId: number;
  private currentProductSettingsId: number;
  private currentColorThemeId: number;
  private currentDropshippingPartnerId: number;
  private currentDropshippingProductId: number;
  private currentProductSyncLogId: number;

  constructor() {
    this.users = new Map();
    this.creators = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.subscriptions = new Map();
    this.analytics = new Map();
    this.affiliateLinks = new Map();
    this.commissions = new Map();
    this.productSettings = new Map();
    this.colorThemes = new Map();
    this.creatorEarnings = new Map();
    this.earningTransactions = new Map();
    this.payoutMethods = new Map();
    this.withdrawalRequests = new Map();
    this.dropshippingPartners = new Map();
    this.dropshippingProducts = new Map();
    this.productSyncLogs = new Map();
    this.currentUserId = 1;
    this.currentCreatorId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentSubscriptionId = 1;
    this.currentAnalyticsId = 1;
    this.currentAffiliateLinkId = 1;
    this.currentCommissionId = 1;
    this.currentProductSettingsId = 1;
    this.currentColorThemeId = 1;
    this.currentDropshippingPartnerId = 1;
    this.currentProductSyncLogId = 1;
    this.currentDropshippingProductId = 1;
    
    // Initialize with admin test account immediately
    this.initializeAdminAccount();
    this.initializeSupplierPartnersAndProducts();
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
      isEmailVerified: true,
      role: 'admin',
      lastActiveAt: new Date(),
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

  async authenticateUser(emailOrUsername: string, password: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(user => 
      user.email === emailOrUsername || user.username === emailOrUsername
    );
    if (user && user.password === password) {
      return user;
    }
    return undefined;
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
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial
    
    const creator: Creator = { 
      ...insertCreator, 
      id,
      storeDescription: insertCreator.storeDescription || null,
      storeLogo: null,
      storeBanner: null,
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

  async getAllCreators(): Promise<Creator[]> {
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

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.customerEmail === email);
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
      affiliateLinkId: insertOrder.affiliateLinkId || null,
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

  // Subscriptions
  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getSubscriptionsByCreator(creatorId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(subscription => subscription.creatorId === creatorId);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id,
      createdAt: new Date(),
      paymentStatus: insertSubscription.paymentStatus || "pending",
      subscriptionStatus: insertSubscription.subscriptionStatus || "active",
      startsAt: insertSubscription.startsAt || new Date(),
      endsAt: insertSubscription.endsAt || null,
      paymentReference: insertSubscription.paymentReference || null,
      metadata: insertSubscription.metadata || {}
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
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
      results = results.filter(analytics => analytics.createdAt && analytics.createdAt >= startDate);
    }
    
    if (endDate) {
      results = results.filter(analytics => analytics.createdAt && analytics.createdAt <= endDate);
    }
    
    return results;
  }

  // Affiliate Links
  async createAffiliateLink(insertAffiliateLink: InsertAffiliateLink): Promise<AffiliateLink> {
    const id = this.currentAffiliateLinkId++;
    const affiliateLink: AffiliateLink = { 
      id, 
      ...insertAffiliateLink,
      createdAt: new Date(),
      clicks: 0,
      conversions: 0,
      isActive: true
    };
    this.affiliateLinks.set(id, affiliateLink);
    return affiliateLink;
  }

  async getAffiliateLinkByCode(linkCode: string): Promise<AffiliateLink | undefined> {
    return Array.from(this.affiliateLinks.values()).find(link => link.linkCode === linkCode);
  }

  async getAffiliateLinksByCreator(creatorId: number): Promise<AffiliateLink[]> {
    return Array.from(this.affiliateLinks.values()).filter(link => link.affiliateCreatorId === creatorId);
  }

  async getAffiliateLinksByProduct(productId: number): Promise<AffiliateLink[]> {
    return Array.from(this.affiliateLinks.values()).filter(link => link.productId === productId);
  }

  async updateAffiliateLinkClicks(linkId: number): Promise<void> {
    const link = this.affiliateLinks.get(linkId);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.affiliateLinks.set(linkId, link);
    }
  }

  async updateAffiliateLinkConversions(linkId: number): Promise<void> {
    const link = this.affiliateLinks.get(linkId);
    if (link) {
      link.conversions = (link.conversions || 0) + 1;
      this.affiliateLinks.set(linkId, link);
    }
  }

  // Commissions
  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const id = this.currentCommissionId++;
    const commission: Commission = { 
      id, 
      ...insertCommission,
      createdAt: new Date(),
      status: 'pending',
      paidAt: null
    };
    this.commissions.set(id, commission);
    return commission;
  }

  async getCommissionsByAffiliate(affiliateCreatorId: number): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(commission => commission.affiliateCreatorId === affiliateCreatorId);
  }

  async getCommissionsByCreator(originalCreatorId: number): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(commission => commission.originalCreatorId === originalCreatorId);
  }

  async updateCommissionStatus(commissionId: number, status: string, paidAt?: Date): Promise<void> {
    const commission = this.commissions.get(commissionId);
    if (commission) {
      commission.status = status;
      if (paidAt) {
        commission.paidAt = paidAt;
      }
      this.commissions.set(commissionId, commission);
    }
  }

  // Product Settings
  async createProductSettings(insertSettings: InsertProductSettings): Promise<ProductSettings> {
    const id = this.currentProductSettingsId++;
    const settings: ProductSettings = { 
      id, 
      ...insertSettings,
      createdAt: new Date()
    };
    this.productSettings.set(id, settings);
    return settings;
  }

  async getProductSettings(productId: number): Promise<ProductSettings | undefined> {
    return Array.from(this.productSettings.values()).find(settings => settings.productId === productId);
  }

  async updateProductSettings(productId: number, updates: Partial<ProductSettings>): Promise<ProductSettings | undefined> {
    const settings = Array.from(this.productSettings.values()).find(s => s.productId === productId);
    if (settings) {
      const updatedSettings = { ...settings, ...updates };
      this.productSettings.set(settings.id, updatedSettings);
      return updatedSettings;
    }
    return undefined;
  }

  // Color Themes
  async createColorTheme(insertTheme: InsertColorTheme): Promise<ColorTheme> {
    const id = this.currentColorThemeId++;
    const theme: ColorTheme = {
      id,
      ...insertTheme,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.colorThemes.set(id, theme);
    return theme;
  }

  async getColorThemes(userId: number): Promise<ColorTheme[]> {
    return Array.from(this.colorThemes.values()).filter(theme => theme.userId === userId);
  }

  async getActiveColorTheme(userId: number): Promise<ColorTheme | undefined> {
    return Array.from(this.colorThemes.values()).find(theme => theme.userId === userId && theme.isActive);
  }

  async updateColorTheme(id: number, updates: Partial<ColorTheme>): Promise<ColorTheme | undefined> {
    const theme = this.colorThemes.get(id);
    if (theme) {
      const updatedTheme = { ...theme, ...updates, updatedAt: new Date() };
      this.colorThemes.set(id, updatedTheme);
      return updatedTheme;
    }
    return undefined;
  }

  async deleteColorTheme(id: number): Promise<boolean> {
    return this.colorThemes.delete(id);
  }

  async setActiveTheme(userId: number, themeId: number): Promise<void> {
    // Deactivate all themes for the user
    for (const [id, theme] of this.colorThemes.entries()) {
      if (theme.userId === userId && theme.isActive) {
        this.colorThemes.set(id, { ...theme, isActive: false, updatedAt: new Date() });
      }
    }
    
    // Activate the selected theme
    const selectedTheme = this.colorThemes.get(themeId);
    if (selectedTheme && selectedTheme.userId === userId) {
      this.colorThemes.set(themeId, { ...selectedTheme, isActive: true, updatedAt: new Date() });
    }
  }

  // Creator Earnings Methods
  async getCreatorEarnings(creatorId: number): Promise<CreatorEarnings | undefined> {
    return Array.from(this.creatorEarnings.values()).find(e => e.creatorId === creatorId);
  }

  async updateCreatorBalance(creatorId: number, amount: string): Promise<void> {
    const existing = Array.from(this.creatorEarnings.values()).find(e => e.creatorId === creatorId);
    if (existing) {
      this.creatorEarnings.set(existing.id, { 
        ...existing, 
        availableBalance: (parseFloat(existing.availableBalance) + parseFloat(amount)).toString(),
        updatedAt: new Date()
      });
    } else {
      this.creatorEarnings.set(this.currentCreatorId++, {
        id: this.currentCreatorId,
        creatorId,
        totalEarnings: amount,
        availableBalance: amount,
        pendingWithdrawals: "0",
        totalWithdrawn: "0",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async createEarningTransaction(transaction: InsertEarningTransaction): Promise<EarningTransaction> {
    const newTransaction: EarningTransaction = {
      id: this.currentAnalyticsId++,
      ...transaction,
      createdAt: new Date()
    };
    this.earningTransactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  async getEarningTransactions(creatorId: number): Promise<EarningTransaction[]> {
    return Array.from(this.earningTransactions.values()).filter(t => t.creatorId === creatorId);
  }

  // Payout Methods
  async getPayoutMethods(creatorId: number): Promise<PayoutMethod[]> {
    return Array.from(this.payoutMethods.values()).filter(p => p.creatorId === creatorId);
  }

  async getPayoutMethod(id: number): Promise<PayoutMethod | undefined> {
    return this.payoutMethods.get(id);
  }

  async createPayoutMethod(method: InsertPayoutMethod): Promise<PayoutMethod> {
    const newMethod: PayoutMethod = {
      id: this.currentAnalyticsId++,
      ...method,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payoutMethods.set(newMethod.id, newMethod);
    return newMethod;
  }

  async deletePayoutMethod(id: number): Promise<void> {
    this.payoutMethods.delete(id);
  }

  // Withdrawal Requests
  async getWithdrawalRequests(creatorId: number): Promise<WithdrawalRequest[]> {
    return Array.from(this.withdrawalRequests.values()).filter(w => w.creatorId === creatorId);
  }

  async getWithdrawalRequest(id: number): Promise<WithdrawalRequest | undefined> {
    return this.withdrawalRequests.get(id);
  }
  
async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
  const [newRequest] = await db
    .insert(withdrawalRequests)
    .values({
      ...request,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning(); // Optional, returns inserted row
  return newRequest;
}

  async updateWithdrawalStatus(id: number, status: string, notes?: string, transactionId?: string): Promise<void> {
    const existing = this.withdrawalRequests.get(id);
    if (existing) {
      this.withdrawalRequests.set(id, {
        ...existing,
        status,
        notes: notes || existing.notes,
        transactionId: transactionId || existing.transactionId,
        processedAt: status === "completed" ? new Date() : existing.processedAt
      });
    }
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return Array.from(this.withdrawalRequests.values());
  }

  // Dropshipping Partners
  async createDropshippingPartner(partner: any): Promise<any> {
    const id = this.currentDropshippingPartnerId++;
    const newPartner = {
      id,
      ...partner,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(id, newPartner);
    return newPartner;
  }

  async getDropshippingPartners(): Promise<any[]> {
    return Array.from(this.dropshippingPartners.values());
  }

  async getDropshippingPartner(id: number): Promise<any> {
    return this.dropshippingPartners.get(id);
  }

  async updateDropshippingPartner(id: number, updates: any): Promise<any> {
    const partner = this.dropshippingPartners.get(id);
    if (!partner) return undefined;
    
    const updatedPartner = {
      ...partner,
      ...updates,
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(id, updatedPartner);
    return updatedPartner;
  }

  async approveDropshippingPartner(id: number, approvedBy: number): Promise<any> {
    const partner = this.dropshippingPartners.get(id);
    if (!partner) return undefined;
    
    const updatedPartner = {
      ...partner,
      status: "approved",
      isActive: true,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(id, updatedPartner);
    return updatedPartner;
  }

  // Dropshipping Products
  async createDropshippingProduct(product: any): Promise<any> {
    const id = this.currentDropshippingProductId++;
    const newProduct = {
      id,
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingProducts.set(id, newProduct);
    return newProduct;
  }

  async getDropshippingProducts(): Promise<any[]> {
    return Array.from(this.dropshippingProducts.values());
  }

  async getDropshippingProductsByPartner(partnerId: number): Promise<any[]> {
    return Array.from(this.dropshippingProducts.values()).filter(product => 
      product.partnerId === partnerId
    );
  }

  async getDropshippingProductByExternalId(partnerId: number, externalId: string): Promise<any> {
    return Array.from(this.dropshippingProducts.values()).find(product => 
      product.partnerId === partnerId && product.externalId === externalId
    );
  }

  async updateDropshippingProduct(id: number, updates: any): Promise<any> {
    const product = this.dropshippingProducts.get(id);
    if (!product) return undefined;
    
    const updatedProduct = {
      ...product,
      ...updates,
      updatedAt: new Date(),
    };
    this.dropshippingProducts.set(id, updatedProduct);
    return updatedProduct;
  }

  // Product Sync Logs
  async createProductSyncLog(log: any): Promise<any> {
    const id = this.currentProductSyncLogId++;
    const newLog = {
      id,
      ...log,
      createdAt: new Date(),
    };
    this.productSyncLogs.set(id, newLog);
    return newLog;
  }

  async getProductSyncLogs(partnerId: number): Promise<any[]> {
    return Array.from(this.productSyncLogs.values())
      .filter(log => log.partnerId === partnerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateProductSyncLog(id: number, updates: any): Promise<any> {
    const log = this.productSyncLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = {
      ...log,
      ...updates,
      updatedAt: new Date(),
    };
    this.productSyncLogs.set(id, updatedLog);
    return updatedLog;
  }

  private initializeSupplierPartnersAndProducts() {
    // Create sample approved supplier partners
    const partner1 = {
      id: this.currentDropshippingPartnerId++,
      userId: 1,
      companyName: "Kenya Electronics Ltd",
      businessLicense: "BL/2024/001",
      contactEmail: "sales@kenyaelectronics.co.ke",
      contactPhone: "+254700123456",
      address: "Industrial Area, Nairobi, Kenya",
      businessType: "wholesaler",
      description: "Leading electronics supplier in East Africa with 15+ years experience",
      website: "https://kenyaelectronics.co.ke",
      defaultCommissionRate: "15.00",
      status: "approved",
      isActive: true,
      approvedBy: 1,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(partner1.id, partner1);

    const partner2 = {
      id: this.currentDropshippingPartnerId++,
      userId: 1,
      companyName: "African Crafts Co",
      businessLicense: "BL/2024/002",
      contactEmail: "info@africancrafts.co.ke",
      contactPhone: "+254722345678",
      address: "Maasai Market, Nairobi, Kenya",
      businessType: "manufacturer",
      description: "Authentic African crafts and accessories made by local artisans",
      website: "https://africancrafts.co.ke",
      defaultCommissionRate: "20.00",
      status: "approved",
      isActive: true,
      approvedBy: 1,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(partner2.id, partner2);

    // Create additional test suppliers for dual product management testing
    const partner3 = {
      id: this.currentDropshippingPartnerId++,
      userId: 1,
      companyName: "TechHub Suppliers",
      businessLicense: "BL/2024/003",
      contactEmail: "orders@techhub.co.ke",
      contactPhone: "+254733456789",
      address: "Tech Plaza, Westlands, Nairobi",
      businessType: "retailer",
      description: "Modern tech supplier with automated product catalog integration",
      website: "https://techhub.co.ke",
      productImportMethod: "automated",
      apiEndpoint: "https://techhub.co.ke/api/products",
      defaultCommissionRate: "12.00",
      status: "approved",
      isActive: true,
      approvedBy: 1,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(partner3.id, partner3);

    const partner4 = {
      id: this.currentDropshippingPartnerId++,
      userId: 1,
      companyName: "Local Artisan Market",
      businessLicense: "BL/2024/004",
      contactEmail: "info@localartisan.co.ke",
      contactPhone: "+254744567890",
      address: "Kibera Creative Hub, Nairobi",
      businessType: "artisan",
      description: "Local artisans collective without website, manual product management",
      website: null,
      productImportMethod: "manual",
      apiEndpoint: null,
      defaultCommissionRate: "25.00",
      status: "approved",
      isActive: true,
      approvedBy: 1,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(partner4.id, partner4);

    // Pending supplier for admin approval testing
    const partner5 = {
      id: this.currentDropshippingPartnerId++,
      userId: 1,
      companyName: "Fashion Forward Kenya",
      businessLicense: "BL/2024/005",
      contactEmail: "apply@fashionforward.co.ke",
      contactPhone: "+254755678901",
      address: "Karen Shopping Centre, Nairobi",
      businessType: "fashion",
      description: "Fashion retailer seeking approval for dropshipping partnership",
      website: "https://fashionforward.co.ke",
      productImportMethod: "automated",
      apiEndpoint: "https://fashionforward.co.ke/api/catalog",
      defaultCommissionRate: "18.00",
      status: "pending",
      isActive: false,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dropshippingPartners.set(partner5.id, partner5);

    // Create sample dropshipping products for these partners
    const products = [
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner1.id,
        name: "Bluetooth Wireless Earbuds",
        description: "High-quality wireless earbuds with noise cancellation and 6-hour battery life",
        category: "Electronics",
        wholesalePrice: "2500.00",
        suggestedRetailPrice: "4000.00",
        minimumPrice: "3000.00",
        currency: "KES",
        images: ["/uploads/earbuds1.jpg", "/uploads/earbuds2.jpg"],
        stock: 150,
        commissionRate: "15.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner1.id,
        name: "Smartphone Power Bank 20000mAh",
        description: "Portable power bank with fast charging and LED display",
        category: "Electronics",
        wholesalePrice: "1800.00",
        suggestedRetailPrice: "2800.00",
        minimumPrice: "2200.00",
        currency: "KES",
        images: ["/uploads/powerbank1.jpg"],
        stock: 80,
        commissionRate: "15.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner2.id,
        name: "Handwoven Basket Set",
        description: "Traditional Kenyan baskets made from natural materials by local artisans",
        category: "Home & Decor",
        wholesalePrice: "1200.00",
        suggestedRetailPrice: "2000.00",
        minimumPrice: "1500.00",
        currency: "KES",
        images: ["/uploads/basket1.jpg", "/uploads/basket2.jpg"],
        stock: 25,
        commissionRate: "20.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner2.id,
        name: "Maasai Beaded Jewelry Set",
        description: "Authentic Maasai beaded necklace and bracelet set",
        category: "Fashion & Accessories",
        wholesalePrice: "800.00",
        suggestedRetailPrice: "1400.00",
        minimumPrice: "1000.00",
        currency: "KES",
        images: ["/uploads/jewelry1.jpg"],
        stock: 40,
        commissionRate: "20.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Products for TechHub Suppliers (automated import method)
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner3.id,
        name: "Gaming Mechanical Keyboard",
        description: "RGB backlit mechanical gaming keyboard with blue switches",
        category: "Electronics",
        wholesalePrice: "4500.00",
        suggestedRetailPrice: "7200.00",
        minimumPrice: "5800.00",
        currency: "KES",
        images: ["/uploads/keyboard1.jpg"],
        stock: 35,
        commissionRate: "12.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner3.id,
        name: "4K Webcam with Microphone",
        description: "Professional 4K webcam with built-in noise-cancelling microphone",
        category: "Electronics",
        wholesalePrice: "6800.00",
        suggestedRetailPrice: "10500.00",
        minimumPrice: "8500.00",
        currency: "KES",
        images: ["/uploads/webcam1.jpg"],
        stock: 22,
        commissionRate: "12.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Products for Local Artisan Market (manual import method)
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner4.id,
        name: "Handwoven Kikoy Beach Towel",
        description: "Traditional kikoy towel handwoven by local artisans in coastal Kenya",
        category: "Home & Lifestyle",
        wholesalePrice: "950.00",
        suggestedRetailPrice: "1800.00",
        minimumPrice: "1400.00",
        currency: "KES",
        images: ["/uploads/kikoy1.jpg"],
        stock: 18,
        commissionRate: "25.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner4.id,
        name: "Wooden Safari Animal Set",
        description: "Hand-carved wooden safari animals made from sustainable mahogany",
        category: "Toys & Games",
        wholesalePrice: "1200.00",
        suggestedRetailPrice: "2400.00",
        minimumPrice: "1800.00",
        currency: "KES",
        images: ["/uploads/animals1.jpg"],
        stock: 12,
        commissionRate: "25.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentDropshippingProductId++,
        partnerId: partner4.id,
        name: "Sisal Market Basket",
        description: "Eco-friendly sisal basket perfect for shopping or home storage",
        category: "Home & Lifestyle",
        wholesalePrice: "650.00",
        suggestedRetailPrice: "1200.00",
        minimumPrice: "950.00",
        currency: "KES",
        images: ["/uploads/basket1.jpg"],
        stock: 30,
        commissionRate: "25.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    products.forEach(product => {
      this.dropshippingProducts.set(product.id, product);
    });
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

  async authenticateUser(emailOrUsername: string, password: string): Promise<User | undefined> {
    console.log(`Authenticating user with email/username: ${emailOrUsername}`);
    const [user] = await db.select().from(users).where(
      or(eq(users.email, emailOrUsername), eq(users.username, emailOrUsername))
    );
    console.log(`Found user:`, user ? { id: user.id, email: user.email, username: user.username } : 'null');
    if (user && user.password === password) {
      console.log(`Password match successful for user: ${user.email}`);
      return user;
    }
    console.log(`Authentication failed - ${user ? 'password mismatch' : 'user not found'}`);
    return undefined;
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
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial
    
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

  async getAllCreators(): Promise<Creator[]> {
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

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerEmail, email));
  }

  // Subscriptions
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription || undefined;
  }

  async getSubscriptionsByCreator(creatorId: number): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.creatorId, creatorId));
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
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

  // Affiliate Links
  async createAffiliateLink(insertAffiliateLink: InsertAffiliateLink): Promise<AffiliateLink> {
    const [affiliateLink] = await db
      .insert(affiliateLinks)
      .values(insertAffiliateLink)
      .returning();
    return affiliateLink;
  }

  async getAffiliateLinkByCode(linkCode: string): Promise<AffiliateLink | undefined> {
    const [link] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.linkCode, linkCode));
    return link || undefined;
  }

  async getAffiliateLinksByCreator(creatorId: number): Promise<AffiliateLink[]> {
    return await db.select().from(affiliateLinks).where(eq(affiliateLinks.affiliateCreatorId, creatorId));
  }

  async getAffiliateLinksByProduct(productId: number): Promise<AffiliateLink[]> {
    return await db.select().from(affiliateLinks).where(eq(affiliateLinks.productId, productId));
  }

  async updateAffiliateLinkClicks(linkId: number): Promise<void> {
    // Get current clicks count
    const [link] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.id, linkId));
    if (link) {
      await db
        .update(affiliateLinks)
        .set({ clicks: (link.clicks || 0) + 1 })
        .where(eq(affiliateLinks.id, linkId));
    }
  }

  async updateAffiliateLinkConversions(linkId: number): Promise<void> {
    // Get current conversions count
    const [link] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.id, linkId));
    if (link) {
      await db
        .update(affiliateLinks)
        .set({ conversions: (link.conversions || 0) + 1 })
        .where(eq(affiliateLinks.id, linkId));
    }
  }

  // Commissions
  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const [commission] = await db
      .insert(commissions)
      .values(insertCommission)
      .returning();
    return commission;
  }

  async getCommissionsByAffiliate(affiliateCreatorId: number): Promise<Commission[]> {
    return await db.select().from(commissions).where(eq(commissions.affiliateCreatorId, affiliateCreatorId));
  }

  async getCommissionsByCreator(originalCreatorId: number): Promise<Commission[]> {
    return await db.select().from(commissions).where(eq(commissions.originalCreatorId, originalCreatorId));
  }

  async updateCommissionStatus(commissionId: number, status: string, paidAt?: Date): Promise<void> {
    const updates: any = { status };
    if (paidAt) {
      updates.paidAt = paidAt;
    }
    await db
      .update(commissions)
      .set(updates)
      .where(eq(commissions.id, commissionId));
  }

  // Product Settings
  async createProductSettings(insertSettings: InsertProductSettings): Promise<ProductSettings> {
    const [settings] = await db
      .insert(productSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async getProductSettings(productId: number): Promise<ProductSettings | undefined> {
    const [settings] = await db.select().from(productSettings).where(eq(productSettings.productId, productId));
    return settings || undefined;
  }

  async updateProductSettings(productId: number, updates: Partial<ProductSettings>): Promise<ProductSettings | undefined> {
    const [settings] = await db
      .update(productSettings)
      .set(updates)
      .where(eq(productSettings.productId, productId))
      .returning();
    return settings || undefined;
  }

  // Color Themes
  async createColorTheme(insertTheme: InsertColorTheme): Promise<ColorTheme> {
    const [theme] = await db
      .insert(colorThemes)
      .values(insertTheme)
      .returning();
    return theme;
  }

  async getColorThemes(userId: number): Promise<ColorTheme[]> {
    return await db.select().from(colorThemes).where(eq(colorThemes.userId, userId));
  }

  async getActiveColorTheme(userId: number): Promise<ColorTheme | undefined> {
    const [theme] = await db
      .select()
      .from(colorThemes)
      .where(eq(colorThemes.userId, userId));
    return theme || undefined;
  }

  async updateColorTheme(id: number, updates: Partial<ColorTheme>): Promise<ColorTheme | undefined> {
    const [theme] = await db
      .update(colorThemes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(colorThemes.id, id))
      .returning();
    return theme || undefined;
  }

  async deleteColorTheme(id: number): Promise<boolean> {
    const result = await db
      .delete(colorThemes)
      .where(eq(colorThemes.id, id))
      .returning();
    return result.length > 0;
  }

  async setActiveTheme(userId: number, themeId: number): Promise<void> {
    // Deactivate all themes for the user
    await db
      .update(colorThemes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(colorThemes.userId, userId));
    
    // Activate the selected theme
    await db
      .update(colorThemes)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(colorThemes.id, themeId));
  }

  // Creator Earnings
  async getCreatorEarnings(creatorId: number): Promise<CreatorEarnings | undefined> {
    const [earnings] = await db.select().from(creatorEarnings).where(eq(creatorEarnings.creatorId, creatorId));
    return earnings || undefined;
  }

  async updateCreatorBalance(creatorId: number, updates: Partial<CreatorEarnings>): Promise<void> {
    await db
      .update(creatorEarnings)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(creatorEarnings.creatorId, creatorId));
  }

  async createEarningTransaction(transaction: InsertEarningTransaction): Promise<EarningTransaction> {
    const [result] = await db
      .insert(earningTransactions)
      .values(transaction)
      .returning();
    return result;
  }

  async getEarningTransactions(creatorId: number): Promise<EarningTransaction[]> {
    return await db.select().from(earningTransactions).where(eq(earningTransactions.creatorId, creatorId));
  }

  // Payout Methods
  async getPayoutMethods(creatorId: number): Promise<PayoutMethod[]> {
    return await db.select().from(payoutMethods).where(eq(payoutMethods.creatorId, creatorId));
  }

  async getPayoutMethod(id: number): Promise<PayoutMethod | undefined> {
    const [method] = await db.select().from(payoutMethods).where(eq(payoutMethods.id, id));
    return method || undefined;
  }

  async createPayoutMethod(method: InsertPayoutMethod): Promise<PayoutMethod> {
    const [result] = await db
      .insert(payoutMethods)
      .values(method)
      .returning();
    return result;
  }

  async deletePayoutMethod(id: number): Promise<boolean> {
    const result = await db
      .delete(payoutMethods)
      .where(eq(payoutMethods.id, id))
      .returning();
    return result.length > 0;
  }

  async unsetDefaultPayoutMethods(creatorId: number): Promise<void> {
    await db
      .update(payoutMethods)
      .set({ isDefault: false })
      .where(eq(payoutMethods.creatorId, creatorId));
  }

  // Withdrawal Requests
  async getWithdrawalRequests(creatorId: number): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.creatorId, creatorId));
  }

  async getWithdrawalRequest(id: number): Promise<WithdrawalRequest | undefined> {
    const [request] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id));
    return request || undefined;
  }

  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [result] = await db
      .insert(withdrawalRequests)
      .values(request)
      .returning();
    return result;
  }

  async updateWithdrawalStatus(id: number, status: string, notes?: string, transactionId?: string): Promise<void> {
    await db
      .update(withdrawalRequests)
      .set({ 
        status, 
        notes, 
        transactionId,
        processedAt: status === 'completed' ? new Date() : undefined,
        failureReason: status === 'failed' ? notes : undefined
      })
      .where(eq(withdrawalRequests.id, id));
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests);
  }

  // Dropshipping Partners
  async createDropshippingPartner(partner: any): Promise<any> {
    const [newPartner] = await db
      .insert(dropshippingPartners)
      .values(partner)
      .returning();
    return newPartner;
  }

  async getDropshippingPartners(): Promise<any[]> {
    return await db.select().from(dropshippingPartners);
  }

  async getDropshippingPartner(id: number): Promise<any> {
    const [partner] = await db.select().from(dropshippingPartners).where(eq(dropshippingPartners.id, id));
    return partner || undefined;
  }

  async updateDropshippingPartner(id: number, updates: any): Promise<any> {
    const [partner] = await db
      .update(dropshippingPartners)
      .set(updates)
      .where(eq(dropshippingPartners.id, id))
      .returning();
    return partner || undefined;
  }

  async approveDropshippingPartner(id: number, approvedBy: number): Promise<any> {
    const [partner] = await db
      .update(dropshippingPartners)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(dropshippingPartners.id, id))
      .returning();
    return partner || undefined;
  }

  // Dropshipping Products
  async createDropshippingProduct(product: any): Promise<any> {
    const [newProduct] = await db
      .insert(dropshippingProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async getDropshippingProducts(): Promise<any[]> {
    return await db.select().from(dropshippingProducts);
  }

  async getDropshippingProductsByPartner(partnerId: number): Promise<any[]> {
    return await db.select().from(dropshippingProducts).where(eq(dropshippingProducts.partnerId, partnerId));
  }

  async updateDropshippingProduct(id: number, updates: any): Promise<any> {
    const [product] = await db
      .update(dropshippingProducts)
      .set(updates)
      .where(eq(dropshippingProducts.id, id))
      .returning();
    return product || undefined;
  }

  async deleteDropshippingProduct(id: number): Promise<boolean> {
    const result = await db.delete(dropshippingProducts).where(eq(dropshippingProducts.id, id));
    return result.rowCount > 0;
  }

  // Product Sync Logs
  async createProductSyncLog(log: any): Promise<any> {
    const [newLog] = await db
      .insert(productSyncLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getProductSyncLogs(partnerId: number): Promise<any[]> {
    return await db.select().from(productSyncLogs).where(eq(productSyncLogs.partnerId, partnerId));
  }

  async getDropshippingProductByExternalId(partnerId: number, externalId: string): Promise<any> {
    const [product] = await db.select().from(dropshippingProducts).where(
      and(eq(dropshippingProducts.partnerId, partnerId), eq(dropshippingProducts.externalId, externalId))
    );
    return product || undefined;
  }

  async updateProductSyncLog(id: number, updates: any): Promise<any> {
    const [log] = await db
      .update(productSyncLogs)
      .set(updates)
      .where(eq(productSyncLogs.id, id))
      .returning();
    return log || undefined;
  }
}

export const storage = new DatabaseStorage();
