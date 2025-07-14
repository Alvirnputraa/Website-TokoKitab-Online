import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BuyLaterPayment } from '../types';
import { useAuth } from '../context/AuthContext';

export const useBuyLaterPayments = () => {
  const [payments, setPayments] = useState<BuyLaterPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      console.log('💳 Fetching buy later payments from database...');
      
      const { data, error } = await supabase
        .from('buy_later_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching buy later payments:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Buy later payments fetched successfully:', data?.length, 'payments');
      setPayments(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Failed to fetch buy later payments');
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (orderID: string, amount: number, notes?: string) => {
    try {
      console.log('💰 Adding new payment:', { orderID, amount, notes });
      
      const { data, error } = await supabase
        .from('buy_later_payments')
        .insert({
          buy_later_order_id: orderID,
          amount: amount,
          notes: notes || null,
          payment_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding payment:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment added successfully:', data);
      
      // Add to local state
      setPayments(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('❌ Failed to add payment:', err);
      throw err;
    }
  };

  const getPaymentsByOrderId = (orderId: string): BuyLaterPayment[] => {
    return payments.filter(payment => payment.buy_later_order_id === orderId);
  };

  const getTotalPaidByOrderId = (orderId: string): number => {
    const orderPayments = getPaymentsByOrderId(orderId);
    return orderPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  const getRemainingAmountByOrderId = (orderId: string, totalOrderAmount: number): number => {
    const totalPaid = getTotalPaidByOrderId(orderId);
    return Math.max(0, totalOrderAmount - totalPaid);
  };

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    addPayment,
    getPaymentsByOrderId,
    getTotalPaidByOrderId,
    getRemainingAmountByOrderId
  };
};