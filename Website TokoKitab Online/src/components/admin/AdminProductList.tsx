import React, { useState } from 'react';
import { Book } from '../../types';
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react';
import ProductModal from './ProductModal.tsx';
import { useBooks } from '../../hooks/useBooks';
import { formatCurrency } from '../../utils/currency';

const AdminProductList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const { books, loading, error, addBook, updateBook, deleteBook } = useBooks();

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

  const handleAddProduct = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (book: Book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      deleteBook(book.id)
        .then(() => {
          alert(`Product "${book.title}" has been deleted successfully!`);
        })
        .catch((error) => {
          alert(`Failed to delete product: ${error.message}`);
        });
    }
  };

  const handleSaveProduct = async (bookData: Partial<Book>) => {
    try {
      if (editingBook) {
        await updateBook(editingBook.id, bookData);
        alert(`Product "${bookData.title}" has been updated successfully!`);
      } else {
        await addBook(bookData as Omit<Book, 'id'>);
        alert(`New product "${bookData.title}" has been created successfully!`);
      }
      setIsModalOpen(false);
      setEditingBook(null);
    } catch (error: any) {
      alert(`Failed to save product: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 pt-16 lg:pt-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading products:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const handleSaveProductOld = (bookData: Partial<Book>) => {
    if (editingBook) {
      alert(`Product "${bookData.title}" would be updated. This is a placeholder for actual update functionality.`);
    } else {
      alert(`New product "${bookData.title}" would be created. This is a placeholder for actual create functionality.`);
    }
    setIsModalOpen(false);
    setEditingBook(null);
  };

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Produk</h1>
            <p className="text-gray-600">Kelola inventaris kitab Anda</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 space-y-4">
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
      <div className="mb-6">
        <p className="text-gray-600">
          Menampilkan {filteredBooks.length} dari {books.length} kitab
        </p>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={book.image}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded-lg mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {book.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {book.author}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {book.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(book.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      book.stock > 10 ? 'bg-green-100 text-green-800' : 
                      book.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {book.stock} tersedia
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(book)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
                        title="Edit Produk"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="text-xs font-medium">Ubah</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(book)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Tidak ada kitab yang sesuai dengan kriteria pencarian Anda.</p>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          book={editingBook}
          onSave={handleSaveProduct}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminProductList;