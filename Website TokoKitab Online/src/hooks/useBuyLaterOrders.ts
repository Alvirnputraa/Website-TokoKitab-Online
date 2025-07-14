import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BuyLaterOrder } from '../types';
import { useAuth } from '../context/AuthContext';

export const useBuyLaterOrders = () => {
  const [buyLaterOrders, setBuyLaterOrders] = useState<BuyLaterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBuyLaterOrders = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching buy later orders from database...');
      
      let query = supabase
        .from('buy_later_orders')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is not admin, only show their orders
      if (user?.role !== 'admin') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching buy later orders:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Buy later orders fetched successfully:', data?.length, 'orders');
      setBuyLaterOrders(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Failed to fetch buy later orders');
    } finally {
      setLoading(false);
    }
  };

  const updateBuyLaterOrderStatus = async (orderId: string, status: BuyLaterOrder['order_status']) => {
    try {
      console.log('📝 Updating buy later order status:', orderId, status);
      
      const { data, error } = await supabase
        .from('buy_later_orders')
        .update({ 
          order_status: status
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating buy later order status:', error);
        throw new Error(error.message);
      }

      console.log('✅ Buy later order status updated successfully:', data);
      
      // Update local state
      setBuyLaterOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, order_status: status, updated_at: data.updated_at } : order
      ));
      
      return data;
    } catch (err) {
      console.error('❌ Failed to update buy later order status:', err);
      throw err;
    }
  };

  const updatePaymentStatus = async (orderId: string, status: BuyLaterOrder['payment_status']) => {
    try {
      console.log('💳 Updating payment status:', orderId, status);
      
      const { data, error } = await supabase
        .from('buy_later_orders')
        .update({ 
          payment_status: status
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating payment status:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment status updated successfully:', data);
      
      // Update local state
      setBuyLaterOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, payment_status: status, updated_at: data.updated_at } : order
      ));
      
      return data;
    } catch (err) {
      console.error('❌ Failed to update payment status:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBuyLaterOrders();
    }
  }, [user]);

  return {
    buyLaterOrders,
    loading,
    error,
    fetchBuyLaterOrders,
    updateBuyLaterOrderStatus,
    updatePaymentStatus
  };
};