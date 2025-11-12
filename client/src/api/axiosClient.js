import axios from 'axios';

/**
 * Axios client instance with custom configuration
 * Base URL points to backend API server
 * Includes request/response interceptors for JWT authentication
 */
const axiosClient = axios.create({
  // API server URL - load from environment variable or default to localhost
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  withCredentials: true, // Allow sending cookies with requests
});

/**
 * Request interceptor - adds JWT token to Authorization header
 * Every API request will include the stored JWT token from localStorage
 */
axiosClient.interceptors.request.use((config) => {
  // Get JWT token from browser storage
  const token = localStorage.getItem('token');
  
  // Add token to Authorization header if it exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

/**
 * Response interceptor - handles authentication errors
 * If API returns 401 (Unauthorized), user is logged out and redirected to login
 * This handles cases where token has expired or is invalid
 */
axiosClient.interceptors.response.use(
  // Success case - return response as-is
  (response) => response,
  
  // Error case - check for authentication errors
  (error) => {
    // If server returns 401 Unauthorized status
    if (error.response?.status === 401) {
      // Clear stored authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect user to login page
      window.location.href = '/login';
    }
    
    // Pass error to calling code
    return Promise.reject(error);
  }
);

export default axiosClient;
