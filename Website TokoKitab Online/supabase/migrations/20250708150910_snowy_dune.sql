/*
  # Create books table for product management

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `title` (text, not null) - Judul buku
      - `author` (text, not null) - Penulis buku
      - `description` (text, not null) - Deskripsi buku
      - `price` (decimal, not null) - Harga buku
      - `image` (text) - URL gambar buku
      - `category` (text, not null) - Kategori buku
      - `stock` (integer, default 0) - Stok buku
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `books` table
    - Add policy for authenticated users to read books
    - Add policy for admins to manage books (CRUD)
    - Add policy for users to read books only

  3. Indexes
    - Add index on category for filtering
    - Add index on title for searching
*/

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  image text DEFAULT 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400',
  category text NOT NULL,
  stock integer DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to read books
CREATE POLICY "Anyone can read books"
  ON books
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to manage books (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage books"
  ON books
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS books_category_idx ON books(category);
CREATE INDEX IF NOT EXISTS books_title_idx ON books(title);
CREATE INDEX IF NOT EXISTS books_author_idx ON books(author);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample books data
INSERT INTO books (title, author, description, price, category, stock, image) VALUES
  (
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.',
    12.99,
    'Classic Literature',
    25,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'To Kill a Mockingbird',
    'Harper Lee',
    'A timeless novel about racial injustice and childhood in the American South.',
    14.99,
    'Classic Literature',
    18,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'The Catcher in the Rye',
    'J.D. Salinger',
    'A controversial novel about teenage rebellion and alienation in 1950s America.',
    13.99,
    'Classic Literature',
    30,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'Pride and Prejudice',
    'Jane Austen',
    'A romantic novel about Elizabeth Bennet and her complex relationship with Mr. Darcy.',
    11.99,
    'Romance',
    22,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    '1984',
    'George Orwell',
    'A dystopian novel about totalitarianism and surveillance in a future society.',
    15.99,
    'Science Fiction',
    35,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'The Lord of the Rings',
    'J.R.R. Tolkien',
    'Epic fantasy trilogy about the quest to destroy the One Ring and save Middle-earth.',
    29.99,
    'Fantasy',
    20,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'Harry Potter and the Philosopher''s Stone',
    'J.K. Rowling',
    'The first book in the magical series about a young wizard''s adventures at Hogwarts.',
    16.99,
    'Fantasy',
    40,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'The Hobbit',
    'J.R.R. Tolkien',
    'A fantasy adventure about Bilbo Baggins and his unexpected journey.',
    18.99,
    'Fantasy',
    28,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  )
ON CONFLICT DO NOTHING;