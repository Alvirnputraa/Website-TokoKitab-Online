import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../types';

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      console.log('📚 Fetching kitab from database...');
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching kitab:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Kitab fetched successfully:', data?.length, 'kitab');
      setBooks(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Failed to fetch kitab');
    } finally {
      setLoading(false);
    }
  };

  const addBook = async (bookData: Omit<Book, 'id'>) => {
    try {
      console.log('➕ Adding new kitab:', bookData);
      
      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding kitab:', error);
        throw new Error(error.message);
      }

      console.log('✅ Kitab added successfully:', data);
      
      // Add to local state
      setBooks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('❌ Failed to add kitab:', err);
      throw err;
    }
  };

  const updateBook = async (id: string, bookData: Partial<Book>) => {
    try {
      console.log('✏️ Updating kitab:', id, bookData);
      
      const { data, error } = await supabase
        .from('books')
        .update(bookData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating kitab:', error);
        throw new Error(error.message);
      }

      console.log('✅ Kitab updated successfully:', data);
      
      // Update local state
      setBooks(prev => prev.map(book => book.id === id ? data : book));
      return data;
    } catch (err) {
      console.error('❌ Failed to update kitab:', err);
      throw err;
    }
  };

  const deleteBook = async (id: string) => {
    try {
      console.log('🗑️ Deleting kitab:', id);
      
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting kitab:', error);
        throw new Error(error.message);
      }

      console.log('✅ Kitab deleted successfully');
      
      // Remove from local state
      setBooks(prev => prev.filter(book => book.id !== id));
    } catch (err) {
      console.error('❌ Failed to delete kitab:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return {
    books,
    loading,
    error,
    fetchBooks,
    addBook,
    updateBook,
    deleteBook
  };
};