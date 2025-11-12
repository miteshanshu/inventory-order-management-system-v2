import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Paper } from '@mui/material';

// Shared table wrapper for listing entities across the app
const MainTable = ({ title, columns, rows, loading = false, onRowClick, toolbar }) => {
  return (
    <Paper
      sx={{
        p: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        borderRadius: '1rem',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {toolbar}
      </Box>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ width: '100%', height: { xs: 420, md: 480 } }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            disableColumnMenu
            disableColumnSelector
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            onRowClick={onRowClick}
            sx={{
              border: 'none',
              backgroundColor: 'background.paper',
              '& .MuiDataGrid-columnHeaders': {
                borderRadius: '0.75rem',
                backgroundColor: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
                fontWeight: 600,
                fontSize: '0.9rem',
              },
              '& .MuiDataGrid-columnSeparator': {
                display: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #edf2f7',
                fontSize: '0.95rem',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(37, 99, 235, 0.04)',
                cursor: onRowClick ? 'pointer' : 'default',
              },
              '& .MuiDataGrid-virtualScroller': {
                borderRadius: '0.75rem',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #e2e8f0',
                borderBottomLeftRadius: '0.75rem',
                borderBottomRightRadius: '0.75rem',
              },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default MainTable;
