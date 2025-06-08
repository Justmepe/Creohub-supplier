export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  type: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentMethod {
  type: 'mpesa' | 'paypal' | 'stripe';
  label: string;
  icon: string;
  enabled: boolean;
}

export interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  salesGrowth: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: number;
    customerName: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
}

export interface StoreTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  layout: 'grid' | 'list' | 'carousel';
}
