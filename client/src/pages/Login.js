import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';

const Login = ({ onLoginSuccess }) => {
  // Tab index decides if we show the login form or the registration form
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ usernameOrEmail: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Authenticate an existing user and persist their session token
  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, loginData);
      if (response.data.success) {
        const { token, username, role } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ username, role }));
        onLoginSuccess();
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new staff account and sign the user in immediately
  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        ...registerData,
        role: 'Staff',
      });
      if (response.data.success) {
        const { token, username, role } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ username, role }));
        onLoginSuccess();
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Split the screen into a marketing panel and the auth form
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: '1.5rem',
        py: { xs: '3rem', md: '4rem' },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '62rem',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          borderRadius: '1.75rem',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 40px 80px rgba(15, 23, 42, 0.12)',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(37, 99, 235, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            p: { xs: '2.5rem', md: '3.25rem' },
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Typography variant="overline" sx={{ letterSpacing: '0.2em', color: 'primary.main' }}>
              Inventory Suite
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Simplify inventory and order management
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '24rem', lineHeight: 1.7 }}>
              Track stock levels, manage supplier relationships, and monitor order fulfillment from a single, modern workspace.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {["Real-time stock visibility", "Smart low-stock alerts", "Supplier performance insights"].map((benefit) => (
              <Box key={benefit} sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  <CheckCircle2 size={18} strokeWidth={1.8} />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {benefit}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: { xs: '2.5rem', md: '3.25rem' }, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {tabValue === 0 ? 'Sign in to your account' : 'Create your account'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enter your credentials to access the inventory dashboard.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Tabs
            value={tabValue}
            onChange={(event, value) => setTabValue(value)}
            variant="fullWidth"
            sx={{
              borderRadius: '999px',
              bgcolor: 'rgba(148, 163, 184, 0.12)',
              '& .MuiTabs-indicator': {
                display: 'none',
              },
              '& .MuiTab-root': {
                minHeight: '2.75rem',
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'text.secondary',
              },
              '& .Mui-selected': {
                bgcolor: 'background.paper',
                color: 'primary.main',
                boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
              },
            }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {tabValue === 0 ? (
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <TextField
                fullWidth
                label="Email or Username"
                value={loginData.usernameOrEmail}
                onChange={(event) => setLoginData({ ...loginData, usernameOrEmail: event.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} strokeWidth={1.6} color="currentColor" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showLoginPassword ? 'text' : 'password'}
                value={loginData.password}
                onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={18} strokeWidth={1.6} color="currentColor" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        edge="end"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff size={18} strokeWidth={1.6} /> : <Eye size={18} strokeWidth={1.6} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={22} /> : 'Login'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <TextField
                fullWidth
                label="Username"
                value={registerData.username}
                onChange={(event) => setRegisterData({ ...registerData, username: event.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserRound size={18} strokeWidth={1.6} color="currentColor" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={registerData.email}
                onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} strokeWidth={1.6} color="currentColor" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showRegisterPassword ? 'text' : 'password'}
                value={registerData.password}
                onChange={(event) => setRegisterData({ ...registerData, password: event.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={18} strokeWidth={1.6} color="currentColor" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowRegisterPassword((prev) => !prev)}
                        edge="end"
                        aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegisterPassword ? <EyeOff size={18} strokeWidth={1.6} /> : <Eye size={18} strokeWidth={1.6} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={22} /> : 'Register'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
