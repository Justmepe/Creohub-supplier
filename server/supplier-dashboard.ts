import { storage } from "./storage";
import type { Request, Response } from "express";

export interface SupplierDashboardData {
  partner: any;
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: string;
    monthlyRevenue: string;
  };
  recentOrders: any[];
  topProducts: any[];
  lowStockProducts: any[];
}

export class SupplierDashboardService {
  async getDashboardData(partnerId: number): Promise<SupplierDashboardData> {
    const partner = await storage.getDropshippingPartner(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Get all products for this partner
    const allProducts = await storage.getDropshippingProductsByPartner(partnerId);
    const activeProducts = allProducts.filter((p: any) => p.isActive);

    // Get orders for this partner - using mock data for now
    const allOrders = await this.getMockOrdersByPartner(partnerId);
    const pendingOrders = allOrders.filter((o: any) => o.status === "pending" || o.status === "confirmed");

    // Calculate revenue
    const totalRevenue = allOrders.reduce((sum: number, order: any) => sum + parseFloat(order.partnerPayment), 0);
    
    // Get current month orders for monthly revenue
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyOrders = allOrders.filter((order: any) => 
      order.createdAt.toISOString().slice(0, 7) === currentMonth
    );
    const monthlyRevenue = monthlyOrders.reduce((sum: number, order: any) => sum + parseFloat(order.partnerPayment), 0);

    // Get recent orders (last 10)
    const recentOrders = allOrders
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Get top selling products
    const productSales = new Map();
    allOrders.forEach((order: any) => {
      const productId = order.dropshippingProductId;
      const current = productSales.get(productId) || { count: 0, revenue: 0 };
      productSales.set(productId, {
        count: current.count + order.quantity,
        revenue: current.revenue + parseFloat(order.partnerPayment)
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, sales]: [any, any]) => {
        const product = allProducts.find((p: any) => p.id === productId);
        return product ? { ...product, salesCount: sales.count, revenue: sales.revenue } : null;
      })
      .filter((p: any) => p !== null)
      .sort((a: any, b: any) => b.salesCount - a.salesCount)
      .slice(0, 5);

    // Get low stock products (stock < 10)
    const lowStockProducts = activeProducts
      .filter((p: any) => p.stock < 10)
      .sort((a: any, b: any) => a.stock - b.stock)
      .slice(0, 10);

    return {
      partner,
      stats: {
        totalProducts: allProducts.length,
        activeProducts: activeProducts.length,
        totalOrders: allOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue: totalRevenue.toFixed(2),
        monthlyRevenue: monthlyRevenue.toFixed(2)
      },
      recentOrders,
      topProducts,
      lowStockProducts
    };
  }

  private async getMockOrdersByPartner(partnerId: number): Promise<any[]> {
    // Mock implementation - in real app this would query the database
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
  }

  async updateOrderStatus(orderId: number, status: string, trackingNumber?: string, notes?: string): Promise<any> {
    const updateData: any = { status };
    
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    
    if (notes) {
      updateData.partnerNotes = notes;
    }

    if (status === "shipped") {
      updateData.shippedAt = new Date();
    } else if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    // Mock implementation
    return { id: orderId, ...updateData, updatedAt: new Date() };
  }

  async updateProductStock(productId: number, newStock: number): Promise<any> {
    return await storage.updateDropshippingProduct(productId, { stock: newStock });
  }

  async bulkUpdateProducts(partnerId: number, updates: Array<{id: number, stock?: number, price?: string, isActive?: boolean}>): Promise<{success: number, errors: string[]}> {
    let success = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        // Verify product belongs to this partner
        const products = await storage.getDropshippingProductsByPartner(partnerId);
        const product = products.find((p: any) => p.id === update.id);
        if (!product) {
          errors.push(`Product ${update.id} not found or access denied`);
          continue;
        }

        const updateData: any = {};
        if (update.stock !== undefined) updateData.stock = update.stock;
        if (update.price !== undefined) updateData.wholesalePrice = update.price;
        if (update.isActive !== undefined) updateData.isActive = update.isActive;

        await storage.updateDropshippingProduct(update.id, updateData);
        success++;
      } catch (error: any) {
        errors.push(`Product ${update.id}: ${error.message}`);
      }
    }

    return { success, errors };
  }

  async getOrderAnalytics(partnerId: number, period: string = "30d"): Promise<any> {
    const orders = await this.getMockOrdersByPartner(partnerId);
    
    // Filter orders by period
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
      case "7d":
        periodStart.setDate(now.getDate() - 7);
        break;
      case "30d":
        periodStart.setDate(now.getDate() - 30);
        break;
      case "90d":
        periodStart.setDate(now.getDate() - 90);
        break;
      case "1y":
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodStart.setDate(now.getDate() - 30);
    }

    const filteredOrders = orders.filter((order: any) => 
      new Date(order.createdAt) >= periodStart
    );

    // Group orders by day
    const dailyStats = new Map();
    filteredOrders.forEach((order: any) => {
      const day = order.createdAt.toISOString().split('T')[0];
      const current = dailyStats.get(day) || { orders: 0, revenue: 0 };
      dailyStats.set(day, {
        orders: current.orders + 1,
        revenue: current.revenue + parseFloat(order.partnerPayment)
      });
    });

    // Convert to array and sort by date
    const chartData = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Calculate totals and averages
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum: number, order: any) => sum + parseFloat(order.partnerPayment), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status breakdown
    const statusBreakdown = filteredOrders.reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: averageOrderValue.toFixed(2),
      chartData,
      statusBreakdown
    };
  }
}

export const supplierDashboardService = new SupplierDashboardService();

