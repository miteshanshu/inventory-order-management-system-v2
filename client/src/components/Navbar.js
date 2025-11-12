import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';

// Map each route to the label we want to show in the header
const pageTitles = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/orders': 'Orders',
  '/suppliers': 'Suppliers',
};

// Display the top bar with the current page title and user menu
const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const title = pageTitles[location.pathname] || 'Inventory';

  // Keep track of the menu trigger so we can anchor the dropdown
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close the dropdown menu when needed
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Clear auth state and send the user back to the login screen
  const handleLogout = () => {
    handleMenuClose();
    onLogout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" color="transparent" sx={{ backgroundImage: 'none' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: '1.5rem', py: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        <Button
          variant="outlined"
          onClick={handleMenuOpen}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
          aria-controls={anchorEl ? 'user-menu' : undefined}
          sx={{
            borderColor: 'transparent',
            bgcolor: 'background.paper',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            px: '0.75rem',
            py: '0.35rem',
            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 600 }}>
            {(user?.username ? user.username.charAt(0) : 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {user?.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.role || 'Staff'}
            </Typography>
          </Box>
          <ChevronDown size={18} strokeWidth={1.6} />
        </Button>
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          keepMounted
        >
          <MenuItem disabled>{user?.role || 'Team Member'}</MenuItem>
          <MenuItem onClick={handleLogout}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={18} strokeWidth={1.6} />
              <Typography variant="body2">Logout</Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
