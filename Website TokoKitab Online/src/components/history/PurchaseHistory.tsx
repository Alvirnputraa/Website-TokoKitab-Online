import React, { useState } from 'react';
import { Search, Filter, Calendar, User, Package, Banknote, Eye, CheckCircle, XCircle, Clock, Phone, Home, History } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useBuyLaterOrders } from '../../hooks/useBuyLaterOrders';
import { useBuyLaterPayments } from '../../hooks/useBuyLaterPayments';
import { formatCurrency } from '../../utils/currency';

const PurchaseHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const { orders, loading, error } = useOrders();
  const { buyLaterOrders, loading: buyLaterLoading, error: buyLaterError } = useBuyLaterOrders();
  const { getPaymentsByOrderId, getTotalPaidByOrderId, getRemainingAmountByOrderId } = useBuyLaterPayments();

  // Combine both order types for unified display
  const allOrders = [
    ...orders.map(order => ({ ...order, orderType: 'buy_now' as const })),
    ...buyLaterOrders.map(order => ({ ...order, orderType: 'buy_later' as const }))
  ];

  const filteredOrders = allOrders
    .filter(order => {
      const matchesSearch = 
        order.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.book_author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price':
          return b.total_price - a.total_price;
        case 'title':
          return a.book_title.localeCompare(b.book_title);
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Eye className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const totalSpent = allOrders.reduce((sum, order) => sum + order.total_price, 0);
  const totalOrders = allOrders.length;
  const totalBooks = allOrders.reduce((sum, order) => sum + order.quantity, 0);
  const pendingOrders = allOrders.filter(order => order.order_status === 'pending').length;
  const buyNowOrders = orders.length;
  const buyLaterOrdersCount = buyLaterOrders.length;

  if (loading || buyLaterLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Riwayat Pembelian</h1>
          <p className="text-gray-600">Lacak pembelian kitab dan status pesanan Anda</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || buyLaterError) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Riwayat Pembelian</h1>
          <p className="text-gray-600">Lacak pembelian kitab dan status pesanan Anda</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading your orders:</p>
          <p>{error || buyLaterError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Riwayat Pembelian</h1>
        <p className="text-gray-600">Lacak pembelian kitab dan status pesanan Anda</p>
      </div>

      {/* Summary Cards - Selected ones only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="text-xs md:text-sm text-gray-600">Tertunda</p>
              <p className="text-xl md:text-2xl font-bold text-yellow-600">{pendingOrders}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600 self-end md:self-auto" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="text-xs md:text-sm text-gray-600">Buy Now</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{buyNowOrders}</p>
            </div>
            <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-600 self-end md:self-auto" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="text-xs md:text-sm text-gray-600">Buy Later</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600">{buyLaterOrdersCount}</p>
            </div>
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-600 self-end md:self-auto" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 md:mb-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari pesanan Anda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Tertunda</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Urutkan berdasarkan Tanggal</option>
            <option value="price">Urutkan berdasarkan Harga</option>
            <option value="title">Urutkan berdasarkan Judul Kitab</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 md:mb-6">
        <p className="text-sm md:text-base text-gray-600">
          Menampilkan {filteredOrders.length} dari {allOrders.length} pesanan
        </p>
      </div>

      {/* Orders Cards - Vertical Layout */}
      <div className="space-y-4 md:space-y-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-100">
            {/* Order Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 md:px-6 py-4 border-b border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    order.orderType === 'buy_later' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <Package className={`h-4 w-4 ${
                      order.orderType === 'buy_later' ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-start justify-between sm:justify-start">
                      <h3 className="text-base md:text-lg font-bold text-gray-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      {/* Status badge and price - show on mobile in right column */}
                      <div className="sm:hidden flex flex-col items-end space-y-1 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(order.order_status)}`}>
                          {getStatusIcon(order.order_status)}
                          <span className="ml-1 capitalize">{order.order_status}</span>
                        </span>
                        <p className="text-lg font-bold text-gray-900 text-right" style={{ marginTop: '4px' }}>
                          {formatCurrency(order.total_price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2" style={{ marginTop: '2px', marginBottom: '2px' }}>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.orderType === 'buy_later' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.orderType === 'buy_later' ? '🕒 Buy Later' : '⚡ Buy Now'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium" style={{ marginTop: '2px' }}>
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-4">
                  {/* Status badge - hide on mobile, show on desktop */}
                  <span className={`hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${getStatusColor(order.order_status)}`}>
                    {getStatusIcon(order.order_status)}
                    <span className="ml-1 capitalize">{order.order_status}</span>
                  </span>
                  <div className="text-right hidden sm:block">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {formatCurrency(order.total_price)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Book Image */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <img
                    src={order.book_image || 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={order.book_title}
                    className="w-24 h-32 md:w-28 md:h-36 object-cover rounded-lg shadow-md border border-gray-200"
                  />
                </div>

                {/* Book Details */}
                <div className="flex-1 space-y-3 md:space-y-4">
                  <div>
                    <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                      {order.book_title}
                    </h4>
                    <p className="text-base text-gray-700 font-medium mb-3">
                      by {order.book_author}
                    </p>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      {order.book_category}
                    </span>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <Package className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">Jumlah</span>
                      </div>
                      <p className="text-base font-bold text-gray-900">
                        {order.quantity} {order.quantity === 1 ? 'kitab' : 'kitab'}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <Banknote className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">Harga Satuan</span>
                      </div>
                      <p className="text-base font-bold text-gray-900">
                        {formatCurrency(order.book_price)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="text-base font-bold text-blue-900 mb-3 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Informasi Pengiriman
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-700" />
                        <span className="text-sm font-medium text-blue-800">{order.user_name}</span>
                      </div>
                      {order.user_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-blue-700" />
                          <span className="text-sm font-medium text-blue-800">{order.user_phone}</span>
                        </div>
                      )}
                      {order.user_room && (
                        <div className="flex items-center space-x-2">
                          <Home className="h-4 w-4 text-blue-700" />
                          <span className="text-sm font-medium text-blue-800">Ruangan {order.user_room}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buy Later Payment Info */}
                  {order.orderType === 'buy_later' && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h5 className="text-base font-bold text-orange-900 mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Informasi Buy Later
                      </h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-800">Durasi Pembayaran:</span>
                          <span className="text-sm font-bold text-orange-900">
                            {(order as any).payment_duration} Bulan
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-800">Tenggat Pembayaran:</span>
                          <span className="text-sm font-bold text-orange-900">
                            {formatDate((order as any).due_date)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-800">Status Pembayaran:</span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            (order as any).payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            (order as any).payment_status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(order as any).payment_status === 'paid' ? '✅' :
                             (order as any).payment_status === 'overdue' ? '⚠️' : '⏳'}
                            <span className="ml-1 capitalize">{(order as any).payment_status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Payment History for Buy Later Orders */}
                      <div className="mt-4 pt-3 border-t border-orange-200">
                        <h6 className="text-sm font-bold text-orange-900 mb-3 flex items-center">
                          <History className="h-4 w-4 mr-2" />
                          History Pembayaran:
                        </h6>
                        
                        {(() => {
                          const orderPayments = getPaymentsByOrderId(order.id);
                          
                          if (orderPayments.length === 0) {
                            return (
                              <div className="bg-orange-100 p-3 rounded-lg border border-orange-200">
                                <p className="text-sm text-orange-700 italic font-medium">Belum ada pembayaran</p>
                              </div>
                            );
                          }

                          const totalPaid = getTotalPaidByOrderId(order.id);
                          const remainingAmount = getRemainingAmountByOrderId(order.id, order.total_price);

                          return (
                            <div className="space-y-2">

                              {/* Individual Payment History */}
                              <div className="space-y-2">
                                {orderPayments.map((payment) => (
                                  <div key={payment.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                      Telah membayar <span className="font-bold">{formatCurrency(payment.amount)}</span> pada <span className="font-semibold">{formatDate(payment.payment_date)}</span>
                                    </p>
                                    {payment.notes && (
                                      <p className="text-sm text-blue-700 mt-2 font-medium">
                                        💬 Catatan: {payment.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Total Terbayar - Moved to bottom for better visibility */}
                              <div className="bg-green-100 border-2 border-green-300 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-bold text-green-900">Total Terbayar</p>
                                    <p className="text-xl font-bold text-green-800">{formatCurrency(totalPaid)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-green-900">Sisa Pembayaran</p>
                                    <p className={`text-xl font-bold ${remainingAmount === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                      {remainingAmount === 0 ? '✅ LUNAS' : formatCurrency(remainingAmount)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Pesanan Ditemukan</h3>
          <p className="text-gray-500 text-base md:text-lg mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Tidak ada pesanan yang sesuai dengan kriteria pencarian Anda.' 
              : 'Anda belum membuat pesanan apapun.'}
          </p>
          {allOrders.length === 0 && (
            <p className="text-gray-400 text-sm mt-2">
              Mulai jelajahi koleksi kitab kami untuk melakukan pembelian pertama Anda!
            </p>
          )}
          {(searchTerm || statusFilter !== 'all') && allOrders.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Hapus filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;