import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Package, History, LogOut, User, UserPlus, ShoppingBag, Menu, X, CreditCard, BarChart3 } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log('Sidebar - Current user:', user);
  console.log('Sidebar - User role:', user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenuItems = [
    { icon: Package, label: 'Produk', path: '/dashboard' },
    { icon: ShoppingBag, label: 'Data Pesanan', path: '/dashboard/orders' },
    { icon: BarChart3, label: 'Rekap Data', path: '/dashboard/analytics' },
    { icon: CreditCard, label: 'Kelola Pembayaran', path: '/dashboard/buy-later-payments' },
    { icon: UserPlus, label: 'Buat Akun', path: '/dashboard/create-account' },
  ];

  const userMenuItems = [
    { icon: Package, label: 'Jelajahi Kitab', path: '/dashboard' },
    { icon: History, label: 'Riwayat Pembelian', path: '/dashboard/history' },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile Menu Button - Integrated with sidebar */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed top-0 left-0 z-50 lg:hidden bg-blue-600 text-white p-3 transition-all duration-300 ${
          isCollapsed ? 'translate-x-0' : 'translate-x-64'
        }`}
        style={{
          borderRadius: isCollapsed ? '0 0 12px 0' : '0 0 12px 12px'
        }}
      >
        {isCollapsed ? (
          <Menu className="h-5 w-5" />
        ) : (
          <X className="h-5 w-5" />
        )}
      </button>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 bg-white h-screen border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none
        ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        w-64
      `}>
        {/* Mobile header space for toggle button */}
        <div className="h-12 lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-end pr-4">
          <div className="text-white text-sm font-medium">Menu</div>
        </div>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">TokoKitab</h1>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-blue-600 capitalize font-medium">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 bg-white">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setIsCollapsed(true); // Close sidebar on mobile after navigation
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;