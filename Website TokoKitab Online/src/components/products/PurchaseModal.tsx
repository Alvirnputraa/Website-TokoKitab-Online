import React, { useState } from 'react';
import { Book } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import BuyLaterModal from './BuyLaterModal';
import { X, ShoppingCart, Clock, Package, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface PurchaseModalProps {
  book: Book | null;
  onClose: () => void;
  onBuyNow: (book: Book, quantity: number) => void;
  onBuyLater: (book: Book, quantity: number) => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ 
  book, 
  onClose, 
  onBuyNow, 
  onBuyLater 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [userPhone, setUserPhone] = useState('');
  const [userRoom, setUserRoom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBuyLaterModal, setShowBuyLaterModal] = useState(false);
  const { user } = useAuth();

  if (!book) return null;

  const totalPrice = book.price * quantity;

  const handleBuyNow = async () => {
    if (!user) {
      setError('Please login to make a purchase');
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
      setError('Please enter your phone number');
      return;
    }

    if (!userRoom.trim()) {
      setError('Please enter your room number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🛒 Creating order...', {
        user_id: user.id,
        book_id: book.id,
        quantity,
        phone: userPhone,
        room: userRoom
      });

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
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
          order_status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation failed:', orderError);
        if (orderError.code === '23503') {
          setError('User profile error. Please logout and login again to refresh your session.');
        } else {
          setError(`Failed to create order: ${orderError.message}`);
        }
        return;
      }

      console.log('✅ Order created successfully:', orderData);

      // Update book stock
      const { error: stockError } = await supabase
        .from('books')
        .update({ 
          stock: book.stock - quantity 
        })
        .eq('id', book.id);

      if (stockError) {
        console.error('⚠️ Stock update failed:', stockError);
        // Don't fail the order, just log the warning
      }

      // Show success message
      alert(`Order Placed Successfully! 🎉\n\nOrder ID: ${orderData.id.slice(0, 8).toUpperCase()}\nBook: ${book.title}\nQuantity: ${quantity}\nTotal: ${formatCurrency(totalPrice)}\n\nYour order is now pending admin confirmation.`);
      
      onClose();
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyLater = () => {
    if (!userPhone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!userRoom.trim()) {
      setError('Please enter your room number');
      return;
    }

    setShowBuyLaterModal(true);
  };

  const handleBuyLaterSuccess = () => {
    setShowBuyLaterModal(false);
    onClose();
  };

  if (showBuyLaterModal) {
    return (
      <BuyLaterModal
        book={book}
        quantity={quantity}
        userPhone={userPhone}
        userRoom={userRoom}
        onClose={() => setShowBuyLaterModal(false)}
        onSuccess={handleBuyLaterSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Detail Produk</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Product Image and Basic Info */}
          <div className="flex space-x-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-28 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{book.title}</h1>
              <p className="text-sm text-gray-600 font-medium mb-2">by {book.author}</p>
              
              {/* Category and Stock */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {book.category}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  book.stock > 10 ? 'bg-green-100 text-green-800' : 
                  book.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  <Package className="h-3 w-3 mr-1" />
                  {book.stock > 0 ? `${book.stock} tersedia` : 'Stok habis'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 leading-relaxed text-justify">{book.description}</p>
          </div>

          {/* Price and Quantity */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(book.price)}</span>
              {quantity > 1 && (
                <p className="text-sm text-blue-600 font-medium">
                  Total: {formatCurrency(totalPrice)}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Jumlah:
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || book.stock === 0}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="w-12 text-center text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg py-1">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(book.stock, quantity + 1))}
                  disabled={quantity >= book.stock || book.stock === 0}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* User Information for Purchase */}
          <div className="space-y-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Informasi Pembelian</h3>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="userPhone" className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Telepon *
                </label>
                <input
                  id="userPhone"
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan nomor telepon Anda"
                  required
                />
              </div>

              <div>
                <label htmlFor="userRoom" className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Ruangan *
                </label>
                <input
                  id="userRoom"
                  type="text"
                  value={userRoom}
                  onChange={(e) => setUserRoom(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan nomor ruangan Anda"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-2 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Pembeli:</strong> {user?.name}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleBuyNow}
              disabled={book.stock === 0 || isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>
                {isLoading ? 'Memproses...' : `Beli Sekarang - ${formatCurrency(totalPrice)}`}
              </span>
            </button>

            <button
              onClick={handleBuyLater}
              disabled={book.stock === 0}
              className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg font-medium hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Beli Nanti</span>
            </button>
          </div>

          {book.stock === 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mt-4">
              <p className="text-sm font-medium">Buku ini sedang tidak tersedia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;