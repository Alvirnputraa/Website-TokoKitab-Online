export interface User {
  id: string;
  nim?: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface Purchase {
  id: string;
  bookId: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
  book: Book;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string | null;
  user_room: string | null;
  book_id: string;
  book_title: string;
  book_author: string;
  book_description: string;
  book_price: number;
  book_image: string | null;
  book_category: string;
  quantity: number;
  total_price: number;
  order_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BuyLaterOrder {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string | null;
  user_room: string | null;
  book_id: string;
  book_title: string;
  book_author: string;
  book_description: string;
  book_price: number;
  book_image: string | null;
  book_category: string;
  quantity: number;
  total_price: number;
  payment_duration: number;
  due_date: string;
  order_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface BuyLaterPayment {
  id: string;
  buy_later_order_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}