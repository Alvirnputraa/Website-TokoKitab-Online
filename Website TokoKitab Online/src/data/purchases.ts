import { Purchase } from '../types';
import { books } from './books';

export const purchases: Purchase[] = [
  {
    id: '1',
    bookId: '1',
    userId: '2',
    quantity: 1,
    totalPrice: 12.99,
    purchaseDate: '2024-01-15',
    book: books[0]
  },
  {
    id: '2',
    bookId: '4',
    userId: '2',
    quantity: 2,
    totalPrice: 23.98,
    purchaseDate: '2024-01-20',
    book: books[3]
  },
  {
    id: '3',
    bookId: '7',
    userId: '2',
    quantity: 1,
    totalPrice: 16.99,
    purchaseDate: '2024-01-25',
    book: books[6]
  }
];