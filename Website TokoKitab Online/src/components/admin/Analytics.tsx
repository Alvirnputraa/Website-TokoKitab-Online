import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Package, DollarSign, Clock, 
  AlertTriangle, Calendar, Download, Printer, Filter, RefreshCw
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatCurrency } from '../../utils/currency';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date())
  });
  
  const { analytics, loading, error, refetch } = useAnalytics(dateRange);

  const handleDateRangeChange = (range: string) => {
    const end = endOfDay(new Date());
    let start: Date;

    switch (range) {
      case 'today':
        start = startOfDay(new Date());
        break;
      case 'week':
        start = startOfDay(subDays(new Date(), 7));
        break;
      case 'month':
        start = startOfDay(subDays(new Date(), 30));
        break;
      case 'quarter':
        start = startOfDay(subDays(new Date(), 90));
        break;
      default:
        start = startOfDay(subDays(new Date(), 30));
    }

    setDateRange({ start, end });
  };

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="p-4 md:p-8 pt-16 lg:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Rekap Data Pembelian</h1>
          <p className="text-gray-600">Dashboard analytics dan laporan penjualan</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 pt-16 lg:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Rekap Data Pembelian</h1>
          <p className="text-gray-600">Dashboard analytics dan laporan penjualan</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading analytics:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Rekap Data Pembelian</h1>
            <p className="text-gray-600">Dashboard analytics dan laporan penjualan</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Refresh</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Printer className="h-4 w-4" />
              <span className="text-sm">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 mr-2">Periode:</span>
          {['today', 'week', 'month', 'quarter'].map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                range === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'today' && 'Hari Ini'}
              {range === 'week' && '7 Hari'}
              {range === 'month' && '30 Hari'}
              {range === 'quarter' && '90 Hari'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Revenue</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">
                {formatCurrency(analytics.totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Orders</p>
              <p className="text-lg md:text-2xl font-bold text-blue-600">{analytics.totalOrders}</p>
            </div>
            <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Customers</p>
              <p className="text-lg md:text-2xl font-bold text-purple-600">{analytics.totalCustomers}</p>
            </div>
            <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Kitab Terjual</p>
              <p className="text-lg md:text-2xl font-bold text-indigo-600">{analytics.totalKitabSold}</p>
            </div>
            <Package className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Pending Buy Later</p>
              <p className="text-lg md:text-2xl font-bold text-yellow-600">{analytics.pendingBuyLater}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Overdue</p>
              <p className="text-lg md:text-2xl font-bold text-red-600">{analytics.overduePayments}</p>
            </div>
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Penjualan (7 Hari Terakhir)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Area type="monotone" dataKey="buyNow" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Buy Now" />
              <Area type="monotone" dataKey="buyLater" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Buy Later" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performa Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryPerformance.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Books */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Kitab Terlaris</h3>
          <div className="space-y-3">
            {analytics.topSellingBooks.slice(0, 5).map((book, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{book.title}</p>
                  <p className="text-xs text-gray-600">by {book.author}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{book.totalSold} terjual</p>
                  <p className="text-xs text-gray-600">{formatCurrency(book.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Customers */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Terbaik</h3>
          <div className="space-y-3">
            {analytics.bestCustomers.slice(0, 5).map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                  <p className="text-xs text-gray-600">{customer.totalOrders} pesanan</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kitab
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.book_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.order_type === 'buy_later' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.order_type === 'buy_later' ? 'Buy Later' : 'Buy Now'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.total_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(transaction.created_at), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;