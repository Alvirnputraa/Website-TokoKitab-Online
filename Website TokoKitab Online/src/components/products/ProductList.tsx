import React, { useState } from 'react';
import ProductCard from './ProductCard';
import PurchaseModal from './PurchaseModal';
import { Book } from '../../types';
import { Search, Filter, Package } from 'lucide-react';
import { useBooks } from '../../hooks/useBooks';

const ProductList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { books, loading, error } = useBooks();

  const categories = ['all', ...new Set(books.map(book => book.category))];

  const filteredBooks = books
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleBuyNow = (book: Book, quantity: number) => {
    const totalPrice = book.price * quantity;
    alert(`Purchase Confirmed!\n\nBook: ${book.title}\nQuantity: ${quantity}\nTotal: $${totalPrice.toFixed(2)}\n\nThis is a placeholder - in a real app, this would process the payment immediately.`);
  };

  const handleBuyLater = (book: Book, quantity: number) => {
    const totalPrice = book.price * quantity;
    alert(`Added to Wishlist!\n\nBook: ${book.title}\nQuantity: ${quantity}\nTotal: $${totalPrice.toFixed(2)}\n\nThis is a placeholder - in a real app, this would save the item for later purchase.`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 pt-16 lg:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Book Collection</h1>
          <p className="text-gray-600">Discover your next favorite book from our curated collection</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading books...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 pt-16 lg:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Book Collection</h1>
          <p className="text-gray-600">Discover your next favorite book from our curated collection</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading books:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Koleksi Kitab</h1>
        <p className="text-gray-600">Temukan kitab favorit Anda dari koleksi pilihan kami</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 md:mb-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari buku berdasarkan judul atau penulis..."
            placeholder="Cari kitab berdasarkan judul atau penulis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Semua Kategori' : category}
                </option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="title">Urutkan berdasarkan Judul</option>
            <option value="author">Urutkan berdasarkan Penulis</option>
            <option value="price">Urutkan berdasarkan Harga</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 md:mb-6">
        <p className="text-gray-600">
          Menampilkan {filteredBooks.length} dari {books.length} kitab
        </p>
      </div>

      {/* Kitab Grid - Smaller cards with more columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredBooks.map((book) => (
          <ProductCard
            key={book.id}
            book={book}
            onSelect={handleSelectBook}
          />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Kitab Ditemukan</h3>
          <p className="text-gray-500 text-lg mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Tidak ada kitab yang sesuai dengan kriteria pencarian Anda.' 
              : 'Tidak ada kitab yang tersedia saat ini.'}
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Hapus filter
            </button>
          )}
        </div>
      )}

      {/* Purchase Modal */}
      {isModalOpen && (
        <PurchaseModal
          book={selectedBook}
          onClose={handleCloseModal}
          onBuyNow={handleBuyNow}
          onBuyLater={handleBuyLater}
        />
      )}
    </div>
  );
};

export default ProductList;