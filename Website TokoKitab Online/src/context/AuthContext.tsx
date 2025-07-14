import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (nim: string, name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadUserProfile = async (authUser: any) => {
    try {
      console.log('Loading user profile for:', authUser.id);
      
      // Fetch user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // Try to create the user profile if it doesn't exist
        console.log('🔧 Profile not found, attempting to create...');
        const { data: createData, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            role: authUser.user_metadata?.role || 'user',
            nim: authUser.user_metadata?.nim || '',
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Failed to create user profile:', createError);
          // Fallback to auth metadata if database operations fail
          const userData: User = {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            role: authUser.user_metadata?.role || 'user',
            nim: authUser.user_metadata?.nim || '',
          };
          console.log('Using fallback user data with role:', userData.role);
          setUser(userData);
          localStorage.setItem('bookstore_user', JSON.stringify(userData));
        } else {
          console.log('✅ User profile created successfully:', createData);
          const userData: User = {
            id: createData.id,
            name: createData.name,
            email: createData.email,
            role: createData.role,
            nim: createData.nim || '',
          };
          setUser(userData);
          localStorage.setItem('tokokitab_user', JSON.stringify(userData));
        }
      } else {
        // Use database profile data (this has the correct role)
        const userData: User = {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role, // This comes from database, not metadata
          nim: profileData.nim || '',
        };
        console.log('✅ Profile loaded from database with role:', userData.role);
        setUser(userData);
        localStorage.setItem('tokokitab_user', JSON.stringify(userData));
      }
    } catch (fetchError) {
      console.error('Failed to fetch profile:', fetchError);
      // Fallback to auth metadata
      const userData: User = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: authUser.user_metadata?.role || 'user',
        nim: authUser.user_metadata?.nim || '',
      };
      console.log('Using fallback user data with role:', userData.role);
      setUser(userData);
      localStorage.setItem('tokokitab_user', JSON.stringify(userData));
    }
  };

  // Initialize auth state from session - only run once
  useEffect(() => {
    if (initialized) return;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // First, try to get user from localStorage for faster loading
        const storedUser = localStorage.getItem('tokokitab_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('📱 Found user in localStorage:', userData.email);
            setUser(userData);
          } catch (e) {
            console.error('Error parsing stored user data:', e);
            localStorage.removeItem('tokokitab_user');
          }
        }

        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear stored user if session is invalid
          setUser(null);
          localStorage.removeItem('tokokitab_user');
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session for user:', session.user.id);
          await loadUserProfile(session.user);
        } else {
          console.log('❌ No existing session found');
          // Clear stored user if no session
          setUser(null);
          localStorage.removeItem('tokokitab_user');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        localStorage.removeItem('tokokitab_user');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized]);

  // Listen for auth state changes - separate useEffect
  useEffect(() => {
    if (!initialized) return;

    console.log('🔗 Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('tokokitab_user');
      }
    });

    return () => {
      console.log('🔌 Cleaning up auth listener...');
      subscription.unsubscribe();
    };
  }, [initialized]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with email:', email);

      // Authenticate with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Auth result:', { data: data?.user?.id, error });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        console.log('Authentication successful, setting user from auth data...');
        
        // Load user profile (this will also set the user state)
        await loadUserProfile(data.user);
        
        console.log('Login successful');
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    return false;
  };

  const register = async (nim: string, name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting registration for:', email);
      console.log('Registration data:', { nim: nim.trim(), name: name.trim(), email: email.trim() });

      // First, sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            nim,
            role: 'user'
          }
        }
      });

      if (authError) {
        console.error('Registration error:', authError);
        return false;
      }

      if (authData.user) {
        console.log('✅ Auth registration successful!');
        console.log('Auth user created with ID:', authData.user.id);
        console.log('Auth user metadata:', authData.user.user_metadata);
        
        // Wait a moment for the trigger to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify that the user profile was created by the trigger
        console.log('🔍 Verifying user profile was created by trigger...');
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Profile verification failed:', profileError);
          console.log('🔧 Trigger might not have worked, trying manual insert...');
          
          // If trigger didn't work, try manual insert with the authenticated session
          const { data: manualInsert, error: manualError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              nim: nim.trim(),
              name: name.trim(),
              email: email.trim(),
              role: 'user'
            })
            .select();
          
          if (manualError) {
            console.error('❌ Manual insert also failed:', manualError);
            console.log('⚠️ Registration completed but profile creation failed');
          } else {
            console.log('✅ Manual profile creation successful:', manualInsert);
          }
        } else {
          console.log('✅ User profile verified in database:', profileData);
        }
        
        console.log('✅ Registration process completed for:', email);
        return true;
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
    return false;
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    localStorage.removeItem('tokokitab_user');
    supabase.auth.signOut();
  };

  const isAuthenticated = !!user && !loading;

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};