import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, ShoppingCart, Truck } from 'lucide-react';

// Responsive drawer widths for different breakpoints
const drawerWidths = { xs: 200, sm: 220, lg: 264 };

// Static menu config used to build the navigation links
const menuItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: PackageSearch },
  { label: 'Orders', path: '/orders', icon: ShoppingCart },
  { label: 'Suppliers', path: '/suppliers', icon: Truck },
];

// Permanent navigation drawer shown on the left
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Quick helper to flag the active route for styling
  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidths,
        flexShrink: 0,
        maxWidth: '100%',
        '& .MuiDrawer-paper': {
          width: drawerWidths,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          px: { xs: '1rem', lg: '1.25rem' },
          py: '1.5rem',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', px: '0.5rem', mb: '2.5rem' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '14px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.contrastText',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          IM
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Inventory
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      <List sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', px: 0 }}>
        {menuItems.map((item) => {
          const ActiveIcon = item.icon;
          const selected = isActive(item.path);
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={selected}
              aria-label={item.label}
              sx={{
                borderRadius: '14px',
                px: '0.85rem',
                py: '0.75rem',
                gap: '0.75rem',
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'rgba(148, 163, 184, 0.14)',
                },
                '& .MuiListItemIcon-root': {
                  minWidth: 0,
                  color: 'text.secondary',
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(37, 99, 235, 0.18)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                  },
                },
              }}
            >
              <ListItemIcon>
                <ActiveIcon size={20} strokeWidth={1.8} />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
