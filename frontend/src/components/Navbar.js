import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Only show navbar for customers, not for restaurant owners or admins
  if (user && (user.role === 'restaurant-owner' || user.role === 'admin')) {
    return null;
  }

  return (
    <nav
      className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 shadow-lg top-0 left-0 w-full z-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-extrabold text-gray-800 hover:scale-105 transition-transform">
                Foodies
              </span>
            </Link>
            {user && (
              <div className="ml-6 flex items-center space-x-6">
                <Link
                  to="/restaurants"
                  className="text-gray-800 hover:text-gray-600 px-3 py-2 transition duration-300"
                >
                  Restaurants
                </Link>
                <Link
                  to="/orders"
                  className="text-gray-800 hover:text-gray-600 px-3 py-2 transition duration-300"
                >
                  My Orders
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-800 hover:text-gray-600 px-3 py-2 transition duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-4 px-4 py-2 rounded-md text-white bg-indigo-700 hover:bg-indigo-800 transition-transform transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/cart"
                  className="text-gray-800 hover:text-gray-600 px-3 py-2 transition duration-300"
                >
                  Cart
                </Link>
                <div className="ml-4 relative group">
                  <button className="flex items-center text-gray-800 hover:text-gray-600 px-3 py-2">
                    {user.name || 'Profile'}
                  </button>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;