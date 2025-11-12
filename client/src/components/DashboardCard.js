import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

// Accent color presets used to keep the cards consistent
const accentTokens = {
  primary: { background: 'rgba(37, 99, 235, 0.12)', foreground: '#2563eb' },
  secondary: { background: 'rgba(147, 51, 234, 0.12)', foreground: '#9333ea' },
  success: { background: 'rgba(22, 163, 74, 0.12)', foreground: '#16a34a' },
  warning: { background: 'rgba(249, 115, 22, 0.12)', foreground: '#f97316' },
};

// Small stat card used on the dashboard summary row
const DashboardCard = ({ title, value, icon: Icon, accent = 'primary', helper }) => {
  const palette = accentTokens[accent] || accentTokens.primary;

  return (
    <Paper
      sx={{
        p: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        borderRadius: '1rem',
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {Icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.background,
              color: palette.foreground,
            }}
          >
            <Icon size={22} strokeWidth={1.8} />
          </Box>
        )}
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {value}
      </Typography>
      {helper && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {helper}
        </Typography>
      )}
    </Paper>
  );
};

export default DashboardCard;
