import { storage } from "./storage";

// Extend storage with missing dropshipping order methods
export class StorageExtensions {
  
  // Dropshipping Orders
  static async getDropshippingOrdersByPartner(partnerId: number): Promise<any[]> {
    // Mock implementation - in real app this would query the database
    const mockOrders = [
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
      },
      {
        id: 2,
        orderId: 102,
        partnerId: partnerId,
        creatorId: 1,
        dropshippingProductId: 2,
        quantity: 1,
        wholesalePrice: "1800.00",
        sellingPrice: "2800.00",
        creatorCommission: "150.00",
        partnerPayment: "1800.00",
        platformFee: "100.00",
        shippingAddress: {
          name: "Jane Smith",
          phone: "+254722345678",
          address: "456 Oak Ave, Mombasa",
          city: "Mombasa",
          country: "Kenya"
        },
        customerInfo: {
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "+254722345678"
        },
        status: "confirmed",
        trackingNumber: "TRK123456789",
        shippedAt: new Date(Date.now() - 43200000), // 12 hours ago
        deliveredAt: null,
        partnerNotes: "Shipped via DHL",
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 43200000)
      },
      {
        id: 3,
        orderId: 103,
        partnerId: partnerId,
        creatorId: 2,
        dropshippingProductId: 3,
        quantity: 3,
        wholesalePrice: "1200.00",
        sellingPrice: "2000.00",
        creatorCommission: "360.00",
        partnerPayment: "3600.00",
        platformFee: "180.00",
        shippingAddress: {
          name: "Mike Johnson",
          phone: "+254733456789",
          address: "789 Pine St, Kisumu",
          city: "Kisumu",
          country: "Kenya"
        },
        customerInfo: {
          name: "Mike Johnson",
          email: "mike@example.com",
          phone: "+254733456789"
        },
        status: "delivered",
        trackingNumber: "TRK987654321",
        shippedAt: new Date(Date.now() - 259200000), // 3 days ago
        deliveredAt: new Date(Date.now() - 86400000), // 1 day ago
        partnerNotes: "Delivered successfully",
        createdAt: new Date(Date.now() - 345600000), // 4 days ago
        updatedAt: new Date(Date.now() - 86400000)
      }
    ];

    return mockOrders.filter(order => order.partnerId === partnerId);
  }

  static async updateDropshippingOrder(orderId: number, updates: any): Promise<any> {
    // Mock implementation - in real app this would update the database
    const mockOrder = {
      id: orderId,
      ...updates,
      updatedAt: new Date()
    };
    return mockOrder;
  }

  static async getDropshippingProduct(productId: number): Promise<any> {
    // Get from existing storage
    const products = await storage.getDropshippingProducts();
    return products.find(p => p.id === productId);
  }

  static async createDropshippingOrder(orderData: any): Promise<any> {
    // Mock implementation - in real app this would insert into database
    const newOrder = {
      id: Date.now(), // Simple ID generation for mock
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newOrder;
  }

  static async getDropshippingOrdersByCreator(creatorId: number): Promise<any[]> {
    // Mock implementation
    const allOrders = await this.getDropshippingOrdersByPartner(1); // Get sample orders
    return allOrders.filter(order => order.creatorId === creatorId);
  }

  static async getDropshippingOrdersByStatus(status: string): Promise<any[]> {
    // Mock implementation
    const allOrders = await this.getDropshippingOrdersByPartner(1); // Get sample orders
    return allOrders.filter(order => order.status === status);
  }

  // Supplier Analytics
  static async getSupplierAnalytics(partnerId: number, period: string = "30d"): Promise<any> {
    const orders = await this.getDropshippingOrdersByPartner(partnerId);
    
    // Calculate basic analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.partnerPayment), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status breakdown
    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: averageOrderValue.toFixed(2),
      statusBreakdown,
      orders: orders.slice(0, 10) // Recent orders
    };
  }

  // Inventory Management
  static async getLowStockProducts(partnerId: number, threshold: number = 10): Promise<any[]> {
    const products = await storage.getDropshippingProductsByPartner(partnerId);
    return products.filter(product => product.stock < threshold);
  }

  static async updateProductStock(productId: number, newStock: number): Promise<any> {
    return await storage.updateDropshippingProduct(productId, { stock: newStock });
  }

  // Bulk operations
  static async bulkUpdateProductPrices(partnerId: number, priceUpdates: Array<{id: number, price: string}>): Promise<{success: number, errors: string[]}> {
    let success = 0;
    const errors: string[] = [];

    for (const update of priceUpdates) {
      try {
        const product = await this.getDropshippingProduct(update.id);
        if (!product || product.partnerId !== partnerId) {
          errors.push(`Product ${update.id} not found or access denied`);
          continue;
        }

        await storage.updateDropshippingProduct(update.id, { wholesalePrice: update.price });
        success++;
      } catch (error: any) {
        errors.push(`Product ${update.id}: ${error.message}`);
      }
    }

    return { success, errors };
  }

  static async bulkUpdateProductStatus(partnerId: number, statusUpdates: Array<{id: number, isActive: boolean}>): Promise<{success: number, errors: string[]}> {
    let success = 0;
    const errors: string[] = [];

    for (const update of statusUpdates) {
      try {
        const product = await this.getDropshippingProduct(update.id);
        if (!product || product.partnerId !== partnerId) {
          errors.push(`Product ${update.id} not found or access denied`);
          continue;
        }

        await storage.updateDropshippingProduct(update.id, { isActive: update.isActive });
        success++;
      } catch (error: any) {
        errors.push(`Product ${update.id}: ${error.message}`);
      }
    }

    return { success, errors };
  }
}

// Extend the main storage object with these methods
Object.assign(storage, {
  getDropshippingOrdersByPartner: StorageExtensions.getDropshippingOrdersByPartner,
  updateDropshippingOrder: StorageExtensions.updateDropshippingOrder,
  getDropshippingProduct: StorageExtensions.getDropshippingProduct,
  createDropshippingOrder: StorageExtensions.createDropshippingOrder,
  getDropshippingOrdersByCreator: StorageExtensions.getDropshippingOrdersByCreator,
  getDropshippingOrdersByStatus: StorageExtensions.getDropshippingOrdersByStatus,
  getSupplierAnalytics: StorageExtensions.getSupplierAnalytics,
  getLowStockProducts: StorageExtensions.getLowStockProducts,
  updateProductStock: StorageExtensions.updateProductStock,
  bulkUpdateProductPrices: StorageExtensions.bulkUpdateProductPrices,
  bulkUpdateProductStatus: StorageExtensions.bulkUpdateProductStatus
});

