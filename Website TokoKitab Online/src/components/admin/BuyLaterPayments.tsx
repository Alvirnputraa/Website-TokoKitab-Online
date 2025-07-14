import React, { useState } from 'react';
import { Search, Filter, CreditCard, User, Package, Banknote, Calendar, CheckCircle, Clock, AlertTriangle, Edit, History, DollarSign } from 'lucide-react';
import { useBuyLaterOrders } from '../../hooks/useBuyLaterOrders';
import { useBuyLaterPayments } from '../../hooks/useBuyLaterPayments';
import PaymentModal from './PaymentModal';
import { formatCurrency } from '../../utils/currency';

const BuyLaterPayments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { buyLaterOrders, loading, error } = useBuyLaterOrders();
  const { payments, addPayment, getPaymentsByOrderId, getTotalPaidByOrderId, getRemainingAmountByOrderId } = useBuyLaterPayments();

  const filteredOrders = buyLaterOrders
    .filter(order => {
      const matchesSearch = 
        order.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.book_author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPaymentStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
      
      return matchesSearch && matchesPaymentStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created_date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'amount':
          return b.total_price - a.total_price;
        case 'customer':
          return a.user_name.localeCompare(b.user_name);
        default:
          return 0;
      }
    });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateClick = (orderId: string) => {
    const order = buyLaterOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentConfirm = async (amount: number, notes?: string) => {
    if (!selectedOrder) return;

    try {
      await addPayment(selectedOrder.id, amount, notes);
      alert(`✅ Pembayaran berhasil dicatat!\n\nNominal: ${formatCurrency(amount)}\nWaktu: ${new Date().toLocaleString('id-ID')}`);
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menyimpan pembayaran');
    }
  };

  const unpaidOrders = buyLaterOrders.filter(order => order.payment_status === 'unpaid').length;
  const paidOrders = buyLaterOrders.filter(order => order.payment_status === 'paid').length;
  const overdueOrders = buyLaterOrders.filter(order => order.payment_status === 'overdue').length;
  const totalRevenue = buyLaterOrders.filter(order => order.payment_status === 'paid').reduce((sum, order) => sum + order.total_price, 0);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Pembayaran Buy Later</h1>
          <p className="text-gray-600">Kelola pembayaran pesanan Buy Later</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Pembayaran Buy Later</h1>
          <p className="text-gray-600">Kelola pembayaran pesanan Buy Later</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading payments:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Pembayaran Buy Later</h1>
        <p className="text-gray-600">Kelola pembayaran pesanan Buy Later</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="text-xs md:text-sm text-gray-600">Belum Bayar</p>
              <p className="text-xl md:text-2xl font-bold text-red-600">{unpaidOrders}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-red-600 self-end md:self-auto" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="text-xs md:text-sm text-gray-600">Sudah Bayar</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{paidOrders}</p>
            </div>
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600 self-end md:self-auto" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="text-xs md:text-sm text-gray-600">Terlambat</p>
              <p className="text-xl md:text-2xl font-bold text-red-800">{overdueOrders}</p>
            </div>
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-800 self-end md:self-auto" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="text-xs md:text-sm text-gray-600">Total Terbayar</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600 self-end md:self-auto" />
            <Banknote className="h-6 w-6 md:h-8 md:w-8 text-green-600 self-end md:self-auto" />
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
            placeholder="Cari berdasarkan nama customer, judul buku, atau Order ID..."
            placeholder="Cari berdasarkan nama customer, judul kitab, atau Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="unpaid">Belum Bayar</option>
              <option value="paid">Sudah Bayar</option>
              <option value="overdue">Terlambat</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="due_date">Urutkan: Jatuh Tempo</option>
            <option value="created_date">Urutkan: Tanggal Pesan</option>
            <option value="amount">Urutkan: Jumlah</option>
            <option value="customer">Urutkan: Customer</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 md:mb-6">
        <p className="text-sm md:text-base text-gray-600">
          Menampilkan {filteredOrders.length} dari {buyLaterOrders.length} pesanan Buy Later
        </p>
      </div>

      {/* Simple Payment List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        {order.user_name} - Order #{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Waktu dipesan: {formatDateTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {(() => {
                      const totalPaid = getTotalPaidByOrderId(order.id);
                      const remainingAmount = getRemainingAmountByOrderId(order.id, order.total_price);
                      
                      return (
                        <div>
                          {totalPaid > 0 ? (
                            <>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(remainingAmount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Sisa dari {formatCurrency(order.total_price)}
                              </p>
                              <p className="text-xs text-green-600">
                                Terbayar: {formatCurrency(totalPaid)}
                              </p>
                            </>
                          ) : (
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(order.total_price)}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    <p className="text-sm text-gray-500">
                      {order.payment_duration} bulan
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleUpdateClick(order.id)}
                    disabled={getRemainingAmountByOrderId(order.id, order.total_price) === 0}
                    className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center space-x-2 ${
                      getRemainingAmountByOrderId(order.id, order.total_price) === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    <Edit className="h-4 w-4" />
                    <span>
                      {getRemainingAmountByOrderId(order.id, order.total_price) === 0 ? 'Lunas' : 'Update'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment History */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <History className="h-4 w-4 text-gray-600" />
                  <span>History Pembayaran:</span>
                </h4>
                
                {(() => {
                  const orderPayments = getPaymentsByOrderId(order.id);
                  
                  if (orderPayments.length === 0) {
                    return (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 italic">Belum ada pembayaran</p>
                      </div>
                    );
                  }

                  const totalPaid = getTotalPaidByOrderId(order.id);
                  const remainingAmount = getRemainingAmountByOrderId(order.id, order.total_price);

                  return (
                    <div className="space-y-3">
                      {/* Payment Summary */}
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Total Terbayar</p>
                            <p className="text-lg font-bold text-blue-800">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-900">Sisa Pembayaran</p>
                            <p className={`text-lg font-bold ${remainingAmount === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                              {remainingAmount === 0 ? '✅ LUNAS' : formatCurrency(remainingAmount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Individual Payments */}
                      <div className="space-y-2">
                        {orderPayments.map((payment) => (
                          <div key={payment.id} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <p className="text-sm text-green-800">
                              <span className="font-medium">Telah membayar {formatCurrency(payment.amount)}</span>
                              <span className="text-green-600"> pada {formatDateTime(payment.payment_date)}</span>
                            </p>
                            {payment.notes && (
                              <p className="text-xs text-green-700 mt-1">
                                Catatan: {payment.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Pembayaran</h3>
          <p className="text-gray-500 text-base md:text-lg mb-4">
            {searchTerm || paymentStatusFilter !== 'all' 
              ? 'Tidak ada pembayaran yang sesuai dengan kriteria pencarian.' 
              : 'Belum ada pesanan Buy Later yang perlu dikelola pembayarannya.'}
          </p>
          {buyLaterOrders.length === 0 && (
            <p className="text-gray-400 text-sm mt-2">
              Pembayaran akan muncul di sini ketika customer melakukan pesanan Buy Later.
            </p>
          )}
          {(searchTerm || paymentStatusFilter !== 'all') && buyLaterOrders.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPaymentStatusFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Hapus filter
            </button>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          orderId={selectedOrder.id}
          orderInfo={{
            customerName: selectedOrder.user_name,
            orderNumber: `#${selectedOrder.id.slice(0, 8).toUpperCase()}`,
            totalAmount: selectedOrder.total_price
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
          }}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
};

export default BuyLaterPayments;