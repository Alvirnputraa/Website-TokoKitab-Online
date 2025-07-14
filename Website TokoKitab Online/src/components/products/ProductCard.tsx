import React from 'react';
import { Book } from '../../types';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface ProductCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ book, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full">
      {/* Kitab Image - Fixed aspect ratio */}
      <div className="aspect-[3/4] sm:aspect-[2/3] overflow-hidden bg-gray-100">
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400';
          }}
        />
      </div>
      
      {/* Card Content - Flex grow to fill remaining space */}
      <div className="p-2 sm:p-3 flex flex-col flex-grow">
        {/* Title and Author */}
        <div className="mb-1 sm:mb-2 flex-grow">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 font-medium mb-1 line-clamp-1">by {book.author}</p>
        </div>
        
        {/* Description - Hidden on very small screens */}
        <p className="text-xs text-gray-600 mb-1 sm:mb-2">
          {book.description.split(' ').slice(0, 7).join(' ')}......
        </p>
        
        {/* Category */}
        <div className="mb-1 sm:mb-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {book.category}
          </span>
        </div>
        
        {/* Price */}
        <div className="mb-1 sm:mb-2">
          <span className="text-sm sm:text-base font-bold text-gray-900 block">
            {formatCurrency(book.price)}
          </span>
        </div>
        
        {/* Stock Status */}
        <div className="mb-2 sm:mb-3">
          <p className={`text-xs font-medium ${
            book.stock > 10 ? 'text-green-600' : 
            book.stock > 0 ? 'text-orange-600' : 
            'text-red-600'
          }`}>
            {book.stock > 10 ? `${book.stock} tersedia` : 
             book.stock > 0 ? `Hanya ${book.stock} tersisa` : 
             'Stok habis'}
          </p>
        </div>
        
        {/* Select Button - Always at bottom */}
        <div className="mt-auto">
          <button
            onClick={() => onSelect(book)}
            disabled={book.stock === 0}
            className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium ${
              book.stock === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{book.stock === 0 ? 'Habis' : 'Pilih'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;