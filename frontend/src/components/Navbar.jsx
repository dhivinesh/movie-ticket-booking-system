import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-indigo-900 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-indigo-400" />
            <Link to="/" className="text-2xl font-bold tracking-tighter hover:text-indigo-200 transition">
              CineBooking
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-indigo-800 px-3 py-1.5 rounded-full text-sm font-medium">
                  <User size={16} />
                  <span>{user.name}</span>
                  {user.role === 'customer' && (
                    <span className="text-indigo-300 ml-2">₹{user.gift_card_balance || 0}</span>
                  )}
                </div>

                <Link
                  to={user.role === 'admin' ? '/admin' : user.role === 'theater_owner' ? '/owner' : '/dashboard'}
                  className="p-2 hover:bg-indigo-800 rounded-full transition"
                  title="Dashboard"
                >
                  <LayoutDashboard size={20} />
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-indigo-800 rounded-full text-red-300 hover:text-red-400 transition"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-indigo-100 hover:text-white font-medium">Login</Link>
                <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-medium transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
