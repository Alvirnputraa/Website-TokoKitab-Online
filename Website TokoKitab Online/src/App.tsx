import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardLayout from './components/layout/DashboardLayout';
import ProductList from './components/products/ProductList';
import AdminProductList from './components/admin/AdminProductList.tsx';
import CreateAccount from './components/admin/CreateAccount.tsx';
import OrderData from './components/admin/OrderData';
import Analytics from './components/admin/Analytics';
import BuyLaterPayments from './components/admin/BuyLaterPayments';
import PurchaseHistory from './components/history/PurchaseHistory';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminProductList />;
  }
  
  return <ProductList />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardContent />} />
            <Route path="orders" element={<OrderData />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="buy-later-payments" element={<BuyLaterPayments />} />
            <Route path="create-account" element={<CreateAccount />} />
            <Route path="history" element={<PurchaseHistory />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;