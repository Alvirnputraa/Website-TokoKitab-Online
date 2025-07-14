/*
  # Create orders table for purchase transactions

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id) - ID pembeli
      - `user_name` (text) - Nama pembeli
      - `user_phone` (text) - Nomor telepon pembeli
      - `user_room` (text) - Ruangan pembeli
      - `book_id` (uuid, references books.id) - ID buku yang dibeli
      - `book_title` (text) - Judul buku
      - `book_author` (text) - Penulis buku
      - `book_description` (text) - Deskripsi buku
      - `book_price` (decimal) - Harga buku saat pembelian
      - `book_image` (text) - URL gambar buku
      - `book_category` (text) - Kategori buku
      - `quantity` (integer) - Jumlah yang dibeli
      - `total_price` (decimal) - Total harga (book_price * quantity)
      - `order_status` (text, default 'pending') - Status pesanan
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `orders` table
    - Users can read their own orders
    - Users can insert their own orders
    - Admins can read all orders
    - Admins can update order status

  3. Indexes
    - Add index on user_id for user's order history
    - Add index on book_id for book sales tracking
    - Add index on order_status for admin filtering
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_phone text,
  user_room text,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_title text NOT NULL,
  book_author text NOT NULL,
  book_description text NOT NULL,
  book_price decimal(10,2) NOT NULL CHECK (book_price >= 0),
  book_image text,
  book_category text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own orders
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own orders
CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for admins to read all orders
CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policy for admins to update order status
CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_book_id_idx ON orders(book_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(order_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();