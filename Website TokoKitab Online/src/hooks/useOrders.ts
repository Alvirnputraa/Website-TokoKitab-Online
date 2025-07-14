import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching orders from database...');
      
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is not admin, only show their orders
      if (user?.role !== 'admin') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching orders:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Orders fetched successfully:', data?.length, 'orders');
      setOrders(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['order_status']) => {
    try {
      console.log('📝 Updating order status:', orderId, status);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          order_status: status
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating order status:', error);
        throw new Error(error.message);
      }

      console.log('✅ Order status updated successfully:', data);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, order_status: status, updated_at: data.updated_at } : order
      ));
      
      return data;
    } catch (err) {
      console.error('❌ Failed to update order status:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus
  };
};