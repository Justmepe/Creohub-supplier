import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Eye,
  Users,
  Package,
  Calendar,
  Download,
  MousePointer
} from "lucide-react";

interface AnalyticsCardsProps {
  creatorId: number;
  totalRevenue: number;
  totalOrders: number;
  viewsCount: number;
}

export default function AnalyticsCards({ 
  creatorId, 
  totalRevenue, 
  totalOrders, 
  viewsCount 
}: AnalyticsCardsProps) {
  
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/creators/${creatorId}/analytics`],
    enabled: !!creatorId,
  });

  const { data: products } = useQuery({
    queryKey: [`/api/creators/${creatorId}/products`],
    enabled: !!creatorId,
  });

  const { data: orders } = useQuery({
    queryKey: [`/api/creators/${creatorId}/orders`],
    enabled: !!creatorId,
  });

  // Process analytics data
  const processAnalyticsData = () => {
    if (!analytics || !orders || !products) return null;

    const viewEvents = analytics.filter((event: any) => event.eventType === 'view');
    const clickEvents = analytics.filter((event: any) => event.eventType === 'click');
    const purchaseEvents = analytics.filter((event: any) => event.eventType === 'purchase');

    // Revenue by month (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === date.getFullYear() && 
               orderDate.getMonth() === date.getMonth() &&
               order.paymentStatus === 'completed';
      });
      
      const revenue = monthOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount), 0);
      
      monthlyRevenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        orders: monthOrders.length
      });
    }

    // Product performance
    const productPerformance = products.map((product: any) => {
      const productOrders = orders.filter((order: any) => 
        order.items?.some((item: any) => item.productId === product.id)
      );
      
      const productViews = viewEvents.filter((event: any) => 
        event.productId === product.id
      ).length;
      
      const productClicks = clickEvents.filter((event: any) => 
        event.productId === product.id
      ).length;

      const revenue = productOrders.reduce((sum: number, order: any) => {
        const item = order.items?.find((item: any) => item.productId === product.id);
        return sum + (item ? item.price * item.quantity : 0);
      }, 0);

      return {
        id: product.id,
        name: product.name,
        type: product.type,
        views: productViews,
        clicks: productClicks,
        orders: productOrders.length,
        revenue,
        conversionRate: productViews > 0 ? (productOrders.length / productViews * 100) : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Traffic sources (mock data for demo)
    const trafficSources = [
      { name: 'Direct', value: 40, color: '#8884d8' },
      { name: 'Social Media', value: 35, color: '#82ca9d' },
      { name: 'Search', value: 15, color: '#ffc658' },
      { name: 'Referral', value: 10, color: '#ff7300' }
    ];

    return {
      monthlyRevenue,
      productPerformance,
      trafficSources,
      totalViews: viewEvents.length,
      totalClicks: clickEvents.length,
      totalPurchases: purchaseEvents.length,
      conversionRate: viewEvents.length > 0 ? (purchaseEvents.length / viewEvents.length * 100) : 0
    };
  };

  const data = processAnalyticsData();

  if (analyticsLoading || !data) {
    return (
      <div className="grid gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate growth (simplified)
  const revenueGrowth = data.monthlyRevenue.length > 1 ? 
    ((data.monthlyRevenue[data.monthlyRevenue.length - 1]?.revenue || 0) - 
     (data.monthlyRevenue[data.monthlyRevenue.length - 2]?.revenue || 0)) /
    (data.monthlyRevenue[data.monthlyRevenue.length - 2]?.revenue || 1) * 100 : 0;

  const ordersGrowth = data.monthlyRevenue.length > 1 ? 
    ((data.monthlyRevenue[data.monthlyRevenue.length - 1]?.orders || 0) - 
     (data.monthlyRevenue[data.monthlyRevenue.length - 2]?.orders || 0)) /
    (data.monthlyRevenue[data.monthlyRevenue.length - 2]?.orders || 1) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  KES {totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ml-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                <div className="flex items-center mt-1">
                  {ordersGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ml-1 ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(ordersGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Store Views</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalViews}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.totalClicks} clicks
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.totalPurchases} purchases
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [`KES ${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#E67E22" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.productPerformance.slice(0, 5).map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{product.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {product.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-x-4">
                      <span>{product.views} views</span>
                      <span>{product.orders} orders</span>
                      <span>{product.conversionRate.toFixed(1)}% conversion</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">KES {product.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.trafficSources.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest customer interactions with your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.slice(-10).reverse().map((event: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {event.eventType === 'view' && <Eye className="h-4 w-4" />}
                  {event.eventType === 'click' && <MousePointer className="h-4 w-4" />}
                  {event.eventType === 'purchase' && <ShoppingBag className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {event.eventType === 'view' && 'Store viewed'}
                    {event.eventType === 'click' && 'Product clicked'}
                    {event.eventType === 'purchase' && 'Purchase completed'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
                {event.eventData?.amount && (
                  <Badge variant="outline">
                    KES {parseFloat(event.eventData.amount).toLocaleString()}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
