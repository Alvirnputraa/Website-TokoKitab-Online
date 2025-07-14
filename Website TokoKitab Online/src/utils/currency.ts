/**
 * Utility functions for currency formatting
 */

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyInput = (amount: number): string => {
  return amount.toLocaleString('id-ID');
};

export const parseCurrencyInput = (value: string): number => {
  return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
};