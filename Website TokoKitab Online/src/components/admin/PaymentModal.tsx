import React, { useState } from 'react';
import { X, Banknote, Calendar, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useBuyLaterPayments } from '../../hooks/useBuyLaterPayments';

interface PaymentModalProps {
  orderId: string;
  orderInfo: {
    customerName: string;
    orderNumber: string;
    totalAmount: number;
  };
  onClose: () => void;
  onConfirm: (amount: number, notes?: string) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  orderId, 
  orderInfo, 
  onClose, 
  onConfirm 
}) => {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { getTotalPaidByOrderId, getRemainingAmountByOrderId } = useBuyLaterPayments();

  const totalPaid = getTotalPaidByOrderId(orderId);
  const remainingAmount = getRemainingAmountByOrderId(orderId, orderInfo.totalAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    
    if (!numericAmount || numericAmount <= 0) {
      setError('Masukkan nominal pembayaran yang valid');
      return;
    }

    if (numericAmount > remainingAmount) {
      setError(`Nominal pembayaran tidak boleh melebihi sisa pembayaran (${formatCurrency(remainingAmount)})`);
      return;
    }

    setIsLoading(true);

    try {
      await onConfirm(numericAmount, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Banknote className="h-5 w-5 text-green-600" />
            <span>Input Pembayaran</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Order Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Informasi Pesanan</h3>
            <div className="space-y-1">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Customer:</span> {orderInfo.customerName}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Order ID:</span> {orderInfo.orderNumber}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Total Pesanan:</span> {formatCurrency(orderInfo.totalAmount)}
              </p>
              {totalPaid > 0 && (
                <>
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Sudah Terbayar:</span> {formatCurrency(totalPaid)}
                  </p>
                  <p className="text-sm text-orange-800">
                    <span className="font-medium">Sisa Pembayaran:</span> {formatCurrency(remainingAmount)}
                  </p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Payment Amount */}
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Nominal Pembayaran (IDR) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Banknote className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="amount"
                type="number"
                step="1000"
                min="1000"
                max={remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Masukkan nominal pembayaran"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maksimal: {formatCurrency(remainingAmount)}
            </p>
          </div>

          {/* Payment Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Pembayaran (Opsional)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Tambahkan catatan pembayaran (opsional)"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>
                {isLoading ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;