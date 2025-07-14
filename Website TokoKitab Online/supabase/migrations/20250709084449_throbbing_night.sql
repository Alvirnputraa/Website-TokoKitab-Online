/*
  # Update sample books with IDR pricing

  1. Price Updates
    - Convert all book prices from USD to IDR
    - Use realistic Indonesian book prices
    - Maintain relative price differences

  2. Sample Data
    - Classic Literature: 150,000 - 200,000 IDR
    - Romance: 120,000 - 180,000 IDR  
    - Science Fiction: 180,000 - 250,000 IDR
    - Fantasy: 200,000 - 350,000 IDR
*/

-- Update existing books with IDR pricing
UPDATE books SET 
  price = CASE 
    WHEN title = 'The Great Gatsby' THEN 159000
    WHEN title = 'To Kill a Mockingbird' THEN 179000
    WHEN title = 'The Catcher in the Rye' THEN 169000
    WHEN title = 'Pride and Prejudice' THEN 149000
    WHEN title = '1984' THEN 189000
    WHEN title = 'The Lord of the Rings' THEN 349000
    WHEN title = 'Harry Potter and the Philosopher''s Stone' THEN 199000
    WHEN title = 'The Hobbit' THEN 229000
    ELSE price
  END
WHERE title IN (
  'The Great Gatsby',
  'To Kill a Mockingbird', 
  'The Catcher in the Rye',
  'Pride and Prejudice',
  '1984',
  'The Lord of the Rings',
  'Harry Potter and the Philosopher''s Stone',
  'The Hobbit'
);

-- Add more Indonesian books with IDR pricing
INSERT INTO books (title, author, description, price, category, stock, image) VALUES
  (
    'Laskar Pelangi',
    'Andrea Hirata',
    'Novel tentang perjuangan anak-anak Belitung untuk mendapatkan pendidikan yang layak.',
    125000,
    'Indonesian Literature',
    45,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'Ayat-Ayat Cinta',
    'Habiburrahman El Shirazy',
    'Novel romantis islami yang mengisahkan perjalanan cinta seorang mahasiswa Indonesia di Mesir.',
    135000,
    'Romance',
    32,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'Bumi Manusia',
    'Pramoedya Ananta Toer',
    'Novel sejarah yang mengisahkan kehidupan di masa kolonial Hindia Belanda.',
    165000,
    'Historical Fiction',
    28,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  ),
  (
    'Negeri 5 Menara',
    'Ahmad Fuadi',
    'Novel inspiratif tentang perjuangan santri di pesantren dan mimpi mereka.',
    145000,
    'Biography',
    38,
    'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'
  )
ON CONFLICT DO NOTHING;