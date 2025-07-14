/*
  # Create buy_later_payments table for payment history

  1. New Tables
    - `buy_later_payments`
      - `id` (uuid, primary key)
      - `buy_later_order_id` (uuid, references buy_later_orders.id)
      - `amount` (decimal) - Nominal pembayaran
      - `payment_date` (timestamp) - Waktu input pembayaran
      - `notes` (text) - Catatan pembayaran (optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `buy_later_payments` table
    - Admins can manage all payment records
    - Users can read their own payment history

  3. Indexes
    - Add index on buy_later_order_id for quick lookups
    - Add index on payment_date for chronological sorting
*/

CREATE TABLE IF NOT EXISTS buy_later_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_later_order_id uuid NOT NULL REFERENCES buy_later_orders(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  payment_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE buy_later_payments ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all payment records
CREATE POLICY "Admins can manage all buy later payments"
  ON buy_later_payments
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy for users to read their own payment history
CREATE POLICY "Users can read own buy later payments"
  ON buy_later_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM buy_later_orders 
      WHERE id = buy_later_order_id AND user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS buy_later_payments_order_id_idx ON buy_later_payments(buy_later_order_id);
CREATE INDEX IF NOT EXISTS buy_later_payments_date_idx ON buy_later_payments(payment_date DESC);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_buy_later_payments_updated_at
  BEFORE UPDATE ON buy_later_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();