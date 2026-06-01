import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Package, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    if (location === '/admin') {
      setShowLogoutModal(true);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <nav className="bg-blue-950 border-b border-blue-900/50 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <div className="flex items-center cursor-pointer group" onClick={handleLogoClick}>
              <div className="bg-blue-600 text-white p-2.5 rounded-xl mr-3 group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                <Package className="w-7 h-7" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Sklad<span className="text-blue-400">Pro</span></span>
            </div>

            {/* O'ng tomon (Admin) */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center text-sm font-bold text-blue-100 hover:text-white transition-colors bg-blue-900/50 hover:bg-blue-800 px-4 py-2.5 rounded-xl border border-blue-800/50 hidden sm:flex">
                      <ShieldCheck className="w-4 h-4 mr-2" /> Boshqaruv Panel
                    </Link>
                  )}
                  <button 
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center text-sm font-bold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 px-4 py-2.5 rounded-xl transition-colors border border-red-900/30"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Chiqish</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="flex items-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Admin Kirish
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ConfirmModal 
        isOpen={showLogoutModal}
        title="Tizimdan chiqish"
        message="Admin paneldan chiqmoqchimisiz?"
        type="logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
