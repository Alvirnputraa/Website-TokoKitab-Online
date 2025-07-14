/*
  # Add order_status column to orders table

  1. Schema Changes
    - Add order_status column with default 'pending'
    - Add check constraint for valid status values
    - Update existing records to have 'pending' status

  2. Status Values
    - pending (default)
    - confirmed
    - completed
    - cancelled

  3. Indexes
    - Add index on order_status for filtering performance
*/

-- Add order_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_status text DEFAULT 'pending';
  END IF;
END $$;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'orders_order_status_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
    CHECK (order_status IN ('pending', 'confirmed', 'completed', 'cancelled'));
  END IF;
END $$;

-- Update existing records to have 'pending' status if they don't have one
UPDATE orders 
SET order_status = 'pending' 
WHERE order_status IS NULL;

-- Make order_status NOT NULL after setting default values
ALTER TABLE orders ALTER COLUMN order_status SET NOT NULL;

-- Add index for better performance on status filtering
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(order_status);

-- Update the updated_at timestamp for any modified records
UPDATE orders SET updated_at = now() WHERE order_status = 'pending';