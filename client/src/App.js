import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

/**
 * PrivateRoute Component
 * Protects routes that require authentication
 * Redirects unauthenticated users to login page
 */
const PrivateRoute = ({ children }) => {
  // Track if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Track if we're still checking authentication status
  const [loading, setLoading] = useState(true);

  // Check for JWT token on component mount
  useEffect(() => {
    // Look for token in browser storage
    const token = localStorage.getItem('token');
    
    // User is authenticated if token exists
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  // Don't render anything while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

/**
 * Main App Component
 * Handles application routing and overall authentication state
 * Renders login page for unauthenticated users
 * Renders dashboard and protected pages for authenticated users
 */
function App() {
  // Track overall authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  /**
   * Clear all authentication data and log user out
   * Called when user clicks logout button
   */
  const handleLogout = () => {
    // Remove JWT token from storage
    localStorage.removeItem('token');
    // Remove user info from storage
    localStorage.removeItem('user');
    // Update authentication state
    setIsAuthenticated(false);
  };

  /**
   * Update authentication state when login succeeds
   * Called after successful login or registration
   */
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        {/* Public login page route */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />
        
        {/* Protected routes - wrapped with PrivateRoute for authentication */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
                  <Navbar onLogout={handleLogout} />
                  <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: '100%', px: { xs: '0.75rem', md: '1.5rem', lg: '2.5rem' }, pb: '2.5rem', overflowX: 'hidden' }}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                    </Routes>
                  </Box>
                </Box>
              </Box>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
