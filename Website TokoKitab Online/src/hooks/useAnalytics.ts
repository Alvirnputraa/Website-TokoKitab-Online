import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalKitabSold: number;
  pendingBuyLater: number;
  overduePayments: number;
  averageOrderValue: number;
  revenueGrowth: number;
  topSellingBooks: Array<{
    title: string;
    author: string;
    totalSold: number;
    revenue: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    totalSold: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    customer_name: string;
    book_title: string;
    total_price: number;
    order_type: string;
    created_at: string;
    status: string;
  }>;
  salesTrend: Array<{
    date: string;
    buyNow: number;
    buyLater: number;
    total: number;
  }>;
  bestCustomers: Array<{
    name: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

export const useAnalytics = (dateRange: { start: Date; end: Date }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalytics = async () => {
    if (user?.role !== 'admin') {
      setError('Unauthorized access');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📊 Fetching analytics data...');

      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();

      // Fetch all orders (Buy Now)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (ordersError) throw ordersError;

      // Fetch all buy later orders
      const { data: buyLaterOrders, error: buyLaterError } = await supabase
        .from('buy_later_orders')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (buyLaterError) throw buyLaterError;

      // Fetch buy later payments
      const { data: payments, error: paymentsError } = await supabase
        .from('buy_later_payments')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (paymentsError) throw paymentsError;

      // Calculate analytics
      const allOrders = [...(orders || []), ...(buyLaterOrders || [])];
      
      // Basic metrics
      const totalRevenue = (orders || []).reduce((sum, order) => sum + order.total_price, 0) +
                          (buyLaterOrders || []).filter(order => order.payment_status === 'paid')
                            .reduce((sum, order) => sum + order.total_price, 0);
      
      const totalOrders = allOrders.length;
      const uniqueCustomers = new Set(allOrders.map(order => order.user_id)).size;
      const totalKitabSold = allOrders.reduce((sum, order) => sum + order.quantity, 0);
      const pendingBuyLater = (buyLaterOrders || []).filter(order => order.payment_status === 'unpaid').length;
      const overduePayments = (buyLaterOrders || []).filter(order => order.payment_status === 'overdue').length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top selling books
      const bookSales = new Map();
      allOrders.forEach(order => {
        const key = `${order.book_title}|${order.book_author}`;
        if (bookSales.has(key)) {
          const existing = bookSales.get(key);
          bookSales.set(key, {
            ...existing,
            totalSold: existing.totalSold + order.quantity,
            revenue: existing.revenue + order.total_price
          });
        } else {
          bookSales.set(key, {
            title: order.book_title,
            author: order.book_author,
            totalSold: order.quantity,
            revenue: order.total_price
          });
        }
      });

      const topSellingBooks = Array.from(bookSales.values())
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10);

      // Category performance
      const categoryStats = new Map();
      allOrders.forEach(order => {
        if (categoryStats.has(order.book_category)) {
          const existing = categoryStats.get(order.book_category);
          categoryStats.set(order.book_category, {
            category: order.book_category,
            totalSold: existing.totalSold + order.quantity,
            revenue: existing.revenue + order.total_price
          });
        } else {
          categoryStats.set(order.book_category, {
            category: order.book_category,
            totalSold: order.quantity,
            revenue: order.total_price
          });
        }
      });

      const categoryPerformance = Array.from(categoryStats.values())
        .sort((a, b) => b.revenue - a.revenue);

      // Recent transactions
      const recentTransactions = allOrders
        .map(order => ({
          id: order.id,
          customer_name: order.user_name,
          book_title: order.book_title,
          total_price: order.total_price,
          order_type: 'orderType' in order ? order.orderType : 
                     ('payment_duration' in order ? 'buy_later' : 'buy_now'),
          created_at: order.created_at,
          status: order.order_status
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Sales trend (last 7 days)
      const salesTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = (orders || []).filter(order => 
          order.created_at.startsWith(dateStr)
        );
        const dayBuyLater = (buyLaterOrders || []).filter(order => 
          order.created_at.startsWith(dateStr)
        );
        
        const buyNowRevenue = dayOrders.reduce((sum, order) => sum + order.total_price, 0);
        const buyLaterRevenue = dayBuyLater.reduce((sum, order) => sum + order.total_price, 0);
        
        salesTrend.push({
          date: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
          buyNow: buyNowRevenue,
          buyLater: buyLaterRevenue,
          total: buyNowRevenue + buyLaterRevenue
        });
      }

      // Best customers
      const customerStats = new Map();
      allOrders.forEach(order => {
        if (customerStats.has(order.user_id)) {
          const existing = customerStats.get(order.user_id);
          customerStats.set(order.user_id, {
            name: order.user_name,
            totalOrders: existing.totalOrders + 1,
            totalSpent: existing.totalSpent + order.total_price
          });
        } else {
          customerStats.set(order.user_id, {
            name: order.user_name,
            totalOrders: 1,
            totalSpent: order.total_price
          });
        }
      });

      const bestCustomers = Array.from(customerStats.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      const analyticsData: AnalyticsData = {
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueCustomers,
        totalKitabSold,
        pendingBuyLater,
        overduePayments,
        averageOrderValue,
        revenueGrowth: 0, // Would need historical data to calculate
        topSellingBooks,
        categoryPerformance,
        recentTransactions,
        salesTrend,
        bestCustomers
      };

      setAnalytics(analyticsData);
      setError(null);
      console.log('✅ Analytics data fetched successfully');

    } catch (err: any) {
      console.error('❌ Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
};