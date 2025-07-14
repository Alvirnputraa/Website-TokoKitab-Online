import React, { useState } from 'react';
import { Book } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Clock, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface BuyLaterModalProps {
  book: Book | null;
  quantity: number;
  userPhone: string;
  userRoom: string;
  onClose: () => void;
  onSuccess: () => void;
}

const BuyLaterModal: React.FC<BuyLaterModalProps> = ({ 
  book, 
  quantity, 
  userPhone, 
  userRoom, 
  onClose, 
  onSuccess 
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  if (!book) return null;

  const totalPrice = book.price * quantity;

  const durations = [
    {
      value: 1,
      label: '1 Bulan',
      description: 'Bayar dalam 30 hari',
      icon: '📅',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      value: 2,
      label: '2 Bulan',
      description: 'Bayar dalam 60 hari',
      icon: '🗓️',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    }
  ];

  const selectedDurationData = durations.find(d => d.value === selectedDuration);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleConfirmOrder = async () => {
    if (!user || !selectedDurationData) {
      setError('Data tidak lengkap');
      return;
    }

    // Verify user exists in database before creating order
    try {
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single();

      if (userError || !userCheck) {
        console.error('❌ User not found in database:', userError);
        setError('User profile not found. Please logout and login again.');
        return;
      }

      console.log('✅ User verified in database:', userCheck);
    } catch (verifyError) {
      console.error('❌ Error verifying user:', verifyError);
      setError('Error verifying user. Please try again.');
      return;
    }

    if (!userPhone.trim()) {
      setError('Nomor telepon diperlukan');
      return;
    }

    if (!userRoom.trim()) {
      setError('Nomor ruangan diperlukan');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🛒 Creating buy later order...', {
        user_id: user.id,
        book_id: book.id,
        quantity,
        payment_duration: selectedDuration,
        due_date: selectedDurationData.dueDate.toISOString()
      });

      // Create buy later order in database
      const { data: orderData, error: orderError } = await supabase
        .from('buy_later_orders')
        .insert({
          user_id: user.id,
          user_name: user.name,
          user_phone: userPhone.trim(),
          user_room: userRoom.trim(),
          book_id: book.id,
          book_title: book.title,
          book_author: book.author,
          book_description: book.description,
          book_price: book.price,
          book_image: book.image,
          book_category: book.category,
          quantity: quantity,
          total_price: totalPrice,
          payment_duration: selectedDuration,
          due_date: selectedDurationData.dueDate.toISOString(),
          order_status: 'pending',
          payment_status: 'unpaid'
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Buy later order creation failed:', orderError);
        if (orderError.code === '23503') {
          setError('User profile error. Please logout and login again to refresh your session.');
        } else {
          setError(`Gagal membuat pesanan: ${orderError.message}`);
        }
        return;
      }

      console.log('✅ Buy later order created successfully:', orderData);

      // Show success message
      alert(`Pesanan Buy Later Berhasil! 🎉\n\nOrder ID: ${orderData.id.slice(0, 8).toUpperCase()}\nBuku: ${book.title}\nJumlah: ${quantity}\nTotal: ${formatCurrency(totalPrice)}\nJatuh Tempo: ${formatDate(selectedDurationData.dueDate)}\n\nPesanan Anda akan dikonfirmasi admin dan buku akan disiapkan. Silakan bayar sebelum tanggal jatuh tempo.`);
      
      onSuccess();
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Buy Later - Pilih Durasi</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Order Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Ringkasan Pesanan</h3>
            <div className="flex items-center space-x-3">
              <img
                src={book.image}
                alt={book.title}
                className="w-12 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{book.title}</p>
                <p className="text-xs text-blue-700">by {book.author}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {quantity} × {formatCurrency(book.price)} = {formatCurrency(totalPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pilih Durasi Pembayaran</h3>
            <div className="space-y-3">
              {durations.map((duration) => (
                <label
                  key={duration.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedDuration === duration.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={duration.value}
                    checked={selectedDuration === duration.value}
                    onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{duration.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{duration.label}</p>
                        <p className="text-sm text-gray-600">{duration.description}</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedDuration === duration.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedDuration === duration.value && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Due Date Info */}
          {selectedDurationData && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
              <div className="flex items-start space-x-2">
                <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Jatuh Tempo Pembayaran</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    <li>• Kitab akan disiapkan setelah admin konfirmasi</li>
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    Pastikan Anda membayar sebelum tanggal jatuh tempo untuk menghindari pembatalan pesanan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">Penting!</p>
                <ul className="text-xs text-orange-800 mt-1 space-y-1">
                  <li>• Buku akan disiapkan setelah admin konfirmasi</li>
                  <li>• Pembayaran harus dilakukan sebelum jatuh tempo</li>
                  <li>• Pesanan akan dibatalkan jika terlambat bayar</li>
                  <li>• Anda akan mendapat notifikasi pengingat pembayaran</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmOrder}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {isLoading ? 'Memproses...' : 'Konfirmasi Pesanan'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyLaterModal;