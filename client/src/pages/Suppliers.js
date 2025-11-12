import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
} from '@mui/material';
import { Plus, Pencil, Trash2, Search, Truck, PhoneCall, Mail, MapPin } from 'lucide-react';
import MainTable from '../components/MainTable';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';

const Suppliers = () => {
  // Core state for supplier list, filters, and dialog form
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState('');
  const [formError, setFormError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    address: '',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Pull supplier data from the API and update the table
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(API_ENDPOINTS.SUPPLIERS.GET_ALL);
      setSuppliers(response.data.data || []);
      setBannerError('');
    } catch (err) {
      setBannerError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  // Aggregate quick stats for the summary cards
  const metrics = useMemo(() => {
    const hasPhone = suppliers.filter((supplier) => (supplier.phone || '').replace(/\D/g, '').length >= 10);
    const hasEmail = suppliers.filter((supplier) => supplier.contactEmail);
    const fullyReachable = suppliers.filter((supplier) => supplier.contactEmail && (supplier.phone || '').replace(/\D/g, '').length >= 10);
    const uniqueRegions = new Set(
      suppliers
        .map((supplier) => {
          if (!supplier.address) {
            return null;
          }
          const parts = supplier.address.split(',').map((part) => part.trim());
          return parts.length ? parts[parts.length - 1]?.toLowerCase() : null;
        })
        .filter(Boolean)
    );
    return {
      totalSuppliers: suppliers.length,
      phoneReady: hasPhone.length,
      emailReady: hasEmail.length,
      omniReady: fullyReachable.length,
      regionCoverage: uniqueRegions.size,
    };
  }, [suppliers]);

  // Build the input for the summary card grid
  const summaryCards = useMemo(
    () => [
      {
        label: 'Supplier Network',
        value: metrics.totalSuppliers.toLocaleString(),
        helper: metrics.regionCoverage ? `${metrics.regionCoverage} regions covered` : 'Add supplier regions',
        iconColor: '#2563eb',
        iconBg: 'rgba(37, 99, 235, 0.12)',
        Icon: Truck,
      },
      {
        label: 'Call Ready',
        value: metrics.phoneReady.toLocaleString(),
        helper: 'Suppliers with active phone contacts',
        iconColor: '#16a34a',
        iconBg: 'rgba(22, 163, 74, 0.12)',
        Icon: PhoneCall,
      },
      {
        label: 'Email Verified',
        value: metrics.emailReady.toLocaleString(),
        helper: 'Suppliers with email outreach',
        iconColor: '#9333ea',
        iconBg: 'rgba(147, 51, 234, 0.12)',
        Icon: Mail,
      },
      {
        label: 'Omni-channel',
        value: metrics.omniReady.toLocaleString(),
        helper: 'Phone and email reachable',
        iconColor: '#f97316',
        iconBg: 'rgba(249, 115, 22, 0.12)',
        Icon: MapPin,
      },
    ],
    [metrics]
  );

  // Bucket suppliers by region for the sidebar insights
  const regionBreakdown = useMemo(() => {
    const counts = new Map();
    suppliers.forEach((supplier) => {
      if (!supplier.address) {
        counts.set('Unassigned', (counts.get('Unassigned') || 0) + 1);
        return;
      }
      const parts = supplier.address.split(',').map((part) => part.trim());
      const region = parts.length ? parts[parts.length - 1] || 'Unassigned' : 'Unassigned';
      counts.set(region, (counts.get(region) || 0) + 1);
    });
    const result = Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
    result.sort((a, b) => b.count - a.count);
    return result.slice(0, 5);
  }, [suppliers]);

  // Summaries of how reachable each supplier is
  const contactBreakdown = useMemo(() => {
    const totals = { Omni: 0, Phone: 0, Email: 0, Limited: 0 };
    suppliers.forEach((supplier) => {
      const digits = (supplier.phone || '').replace(/\D/g, '');
      const hasPhone = digits.length >= 10;
      const hasEmail = Boolean(supplier.contactEmail);
      if (hasPhone && hasEmail) {
        totals.Omni += 1;
      } else if (hasPhone) {
        totals.Phone += 1;
      } else if (hasEmail) {
        totals.Email += 1;
      } else {
        totals.Limited += 1;
      }
    });
    const total = suppliers.length || 1;
    return [
      { key: 'Omni', label: 'Phone + Email', count: totals.Omni, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', percentage: Math.round((totals.Omni / total) * 100) },
      { key: 'Phone', label: 'Phone ready', count: totals.Phone, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)', percentage: Math.round((totals.Phone / total) * 100) },
      { key: 'Email', label: 'Email ready', count: totals.Email, color: '#9333ea', bg: 'rgba(147, 51, 234, 0.12)', percentage: Math.round((totals.Email / total) * 100) },
      { key: 'Limited', label: 'Needs update', count: totals.Limited, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', percentage: Math.round((totals.Limited / total) * 100) },
    ];
  }, [suppliers]);

  // Shape each supplier with helper flags for the table
  const rows = useMemo(
    () =>
      suppliers.map((supplier) => {
        const digits = (supplier.phone || '').replace(/\D/g, '');
        const hasPhone = digits.length >= 10;
        const hasEmail = Boolean(supplier.contactEmail);
        let contactStrength = 'Limited';
        if (hasPhone && hasEmail) {
          contactStrength = 'Omni-channel';
        } else if (hasPhone || hasEmail) {
          contactStrength = hasPhone ? 'Phone ready' : 'Email ready';
        }
        return {
          id: supplier.id,
          ...supplier,
          hasPhone,
          hasEmail,
          contactStrength,
        };
      }),
    [suppliers]
  );

  // Apply search text and contact filter before rendering
  const filteredRows = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesContact =
        contactFilter === 'All' ||
        (contactFilter === 'Phone' && row.hasPhone) ||
        (contactFilter === 'Email' && row.hasEmail) ||
        (contactFilter === 'Omni' && row.hasPhone && row.hasEmail);
      if (!matchesContact) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      const fields = [row.name, row.contactEmail, row.phone, row.address];
      return fields.some((field) => field && field.toString().toLowerCase().includes(normalized));
    });
  }, [rows, searchTerm, contactFilter]);

  // Flags that drive the empty state and filter reset button
  const filtersApplied = Boolean(searchTerm.trim() || contactFilter !== 'All');
  const showEmptyState = !loading && filteredRows.length === 0;

  // Open the dialog with a fresh form
  const handleAddClick = () => {
    setFormData({ name: '', contactEmail: '', phone: '', address: '' });
    setEditingId(null);
    setFormError('');
    setOpenDialog(true);
  };

  // Close the dialog and clear any inline validation
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  // Keep input fields in sync with the form state
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validate the form and persist the supplier
  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError('Enter a supplier name');
      return;
    }
    if (formData.contactEmail && !/^.+@.+\..+$/.test(formData.contactEmail.trim())) {
      setFormError('Enter a valid email address');
      return;
    }
    const digits = formData.phone.replace(/\D/g, '');
    if (formData.phone && digits.length < 10) {
      setFormError('Enter a valid 10-digit phone number');
      return;
    }
    try {
      const payload = {
        name: trimmedName,
        contactEmail: formData.contactEmail.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      };
      if (editingId) {
        await axiosClient.put(API_ENDPOINTS.SUPPLIERS.UPDATE(editingId), payload);
      } else {
        await axiosClient.post(API_ENDPOINTS.SUPPLIERS.CREATE, payload);
      }
      await fetchSuppliers();
      setOpenDialog(false);
      setFormError('');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  // Remove a supplier after a quick confirmation
  const handleDelete = async (id) => {
    if (window.confirm('Remove this supplier?')) {
      try {
        await axiosClient.delete(API_ENDPOINTS.SUPPLIERS.DELETE(id));
        await fetchSuppliers();
      } catch (err) {
        setBannerError('Failed to delete supplier');
      }
    }
  };

  // Reset the search bar and contact filter
  const handleResetFilters = () => {
    setSearchTerm('');
    setContactFilter('All');
  };

  // DataGrid column definitions for the supplier table
  const columns = [
    { field: 'name', headerName: 'Supplier', flex: 1, minWidth: 200 },
    { field: 'contactEmail', headerName: 'Email', flex: 1, minWidth: 220 },
    { field: 'phone', headerName: 'Phone', width: 160 },
    { field: 'address', headerName: 'Address', flex: 1.2, minWidth: 240 },
    {
      field: 'contactStrength',
      headerName: 'Contact readiness',
      width: 180,
      renderCell: ({ value }) => {
        const map = {
          'Omni-channel': { label: 'Phone + Email', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
          'Phone ready': { label: 'Phone only', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
          'Email ready': { label: 'Email only', color: '#9333ea', bg: 'rgba(147, 51, 234, 0.12)' },
          Limited: { label: 'Needs update', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
        };
        const config = map[value] || map.Limited;
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: config.bg,
              color: config.color,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Pencil size={16} strokeWidth={1.8} />}
                onClick={() => {
                  setFormData({
                    name: params.row.name,
                    contactEmail: params.row.contactEmail || '',
                    phone: params.row.phone || '',
                    address: params.row.address || '',
                  });
                  setEditingId(params.row.id);
                  setFormError('');
                  setOpenDialog(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={16} strokeWidth={1.8} />}
                onClick={() => handleDelete(params.row.id)}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  // Keep the spinner visible until we have the first dataset
  if (loading && suppliers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Suppliers</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '42rem' }}>
          Build resilient sourcing, validate GST-ready contacts, and align vendors with India fulfillment timelines.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {summaryCards.map((card) => (
          <Grid key={card.label} item xs={12} sm={6} lg={3}>
            <Paper
              sx={{
                p: '1.25rem',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  backgroundColor: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.iconColor,
                }}
              >
                <card.Icon size={22} strokeWidth={1.8} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 0.6 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {card.helper}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {suppliers.length > 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: '1.5rem',
                borderRadius: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Contact health
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Understand how reachable your supplier base is today
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {contactBreakdown.map((bucket) => (
                  <Box key={bucket.key} sx={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <Chip
                        label={bucket.label}
                        size="small"
                        sx={{ fontWeight: 600, backgroundColor: bucket.bg, color: bucket.color }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {bucket.count.toLocaleString()} suppliers · {bucket.percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={bucket.percentage}
                      sx={{
                        height: 6,
                        borderRadius: 999,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 999,
                          backgroundColor: bucket.color,
                        },
                        backgroundColor: bucket.bg,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: '1.5rem',
                borderRadius: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Region coverage
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Top markets represented in your supplier roster
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {regionBreakdown.map((region) => {
                  const percentage = Math.round((region.count / suppliers.length) * 100);
                  return (
                    <Box key={region.name} sx={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {region.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {region.count.toLocaleString()} partners · {percentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 999,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
                {regionBreakdown.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Add supplier addresses to highlight geographic reach.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Paper
        sx={{
          p: '1.5rem',
          borderRadius: '1rem',
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: '1.5fr minmax(240px, 1fr) auto' },
          alignItems: { xs: 'stretch', md: 'center' },
        }}
      >
        <TextField
          placeholder="Search suppliers"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} strokeWidth={1.8} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl fullWidth>
          <InputLabel>Contact readiness</InputLabel>
          <Select value={contactFilter} label="Contact readiness" onChange={(event) => setContactFilter(event.target.value)}>
            <MenuItem value="All">All suppliers</MenuItem>
            <MenuItem value="Omni">Phone + Email</MenuItem>
            <MenuItem value="Phone">Phone ready</MenuItem>
            <MenuItem value="Email">Email ready</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={handleResetFilters}
          disabled={!filtersApplied}
          sx={{ width: { xs: '100%', sm: '100%', md: 'auto' }, justifySelf: { md: 'end' }, whiteSpace: 'nowrap', minWidth: { md: 140 } }}
        >
          Reset filters
        </Button>
      </Paper>

      {bannerError && <Alert severity="error">{bannerError}</Alert>}

      {showEmptyState ? (
        <Paper
          sx={{
            p: '3rem',
            borderRadius: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            textAlign: 'center',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 360 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {filtersApplied ? 'No suppliers match your filters' : 'No suppliers yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filtersApplied
                ? 'Relax the contact filters or search term to review more vendors.'
                : 'Add supplier partners to capture GST-aligned sourcing and lead time commitments.'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {filtersApplied && (
              <Button variant="outlined" onClick={handleResetFilters}>
                Clear filters
              </Button>
            )}
            {isAdmin && (
              <Button variant="contained" startIcon={<Plus size={18} strokeWidth={1.8} />} onClick={handleAddClick}>
                Add supplier
              </Button>
            )}
          </Box>
        </Paper>
      ) : (
        <MainTable
          title="Supplier Directory"
          columns={columns}
          rows={filteredRows}
          loading={loading}
          toolbar={
            isAdmin && (
              <Button variant="contained" startIcon={<Plus size={18} strokeWidth={1.8} />} onClick={handleAddClick}>
                Add supplier
              </Button>
            )
          }
        />
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1.5rem',
            p: '0.5rem',
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingId ? 'Edit supplier' : 'Add new supplier'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', mt: '0.5rem' }}>
            <TextField label="Supplier name" name="name" value={formData.name} onChange={handleInputChange} fullWidth />
            <TextField label="Contact email" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} fullWidth />
            <TextField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} fullWidth placeholder="e.g. +91 98765 43210" />
            <TextField label="Business address" name="address" value={formData.address} onChange={handleInputChange} fullWidth multiline rows={3} />
            {formError && <Alert severity="error">{formError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: '1.5rem', pb: '1.5rem' }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;
