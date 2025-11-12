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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Plus, Trash2, Search, ClipboardList, TrendingUp, TrendingDown, CircleDollarSign } from 'lucide-react';
import MainTable from '../components/MainTable';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { formatCurrency } from '../utils/currencyFormatter';
import { formatDate } from '../utils/formatDate';

const Orders = () => {
  // Page-level state for the order list and supporting dropdowns
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState('');
  const [formError, setFormError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [formData, setFormData] = useState({
    type: 'Sales',
    supplierId: '',
    customerName: '',
    items: [],
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  useEffect(() => {
    fetchData();
  }, []);

  // Load remote data so the table and dialog have what they need
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, suppliersRes] = await Promise.all([
        axiosClient.get(API_ENDPOINTS.ORDERS.GET_ALL),
        axiosClient.get(API_ENDPOINTS.PRODUCTS.GET_ALL),
        axiosClient.get(API_ENDPOINTS.SUPPLIERS.GET_ALL),
      ]);
      setOrders(ordersRes.data.data || []);
      setProducts(productsRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setBannerError('');
    } catch (err) {
      setBannerError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Summaries for the header cards
  const metrics = useMemo(() => {
    const aggregated = orders.reduce(
      (acc, order) => {
        const amount = Number(order.totalAmount) || 0;
        if (order.type === 'Sales') {
          acc.salesOrders += 1;
          acc.salesValue += amount;
        }
        if (order.type === 'Purchase') {
          acc.purchaseOrders += 1;
          acc.purchaseValue += amount;
        }
        acc.totalValue += amount;
        return acc;
      },
      { salesOrders: 0, purchaseOrders: 0, salesValue: 0, purchaseValue: 0, totalValue: 0 }
    );
    const totalOrders = orders.length;
    return {
      totalOrders,
      salesOrders: aggregated.salesOrders,
      purchaseOrders: aggregated.purchaseOrders,
      salesValue: aggregated.salesValue,
      purchaseValue: aggregated.purchaseValue,
      avgOrderValue: totalOrders ? aggregated.totalValue / totalOrders : 0,
    };
  }, [orders]);

  // Shape the props needed by the dashboard cards
  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Orders',
        value: metrics.totalOrders.toLocaleString(),
        helper: `${metrics.salesOrders} sales • ${metrics.purchaseOrders} purchase`,
        iconColor: '#2563eb',
        iconBg: 'rgba(37, 99, 235, 0.12)',
        Icon: ClipboardList,
      },
      {
        label: 'Sales Value',
        value: formatCurrency(metrics.salesValue),
        helper: metrics.salesOrders ? `${metrics.salesOrders} recorded` : 'No sales orders',
        iconColor: '#16a34a',
        iconBg: 'rgba(22, 163, 74, 0.12)',
        Icon: TrendingUp,
      },
      {
        label: 'Purchase Value',
        value: formatCurrency(metrics.purchaseValue),
        helper: metrics.purchaseOrders ? `${metrics.purchaseOrders} recorded` : 'No purchase orders',
        iconColor: '#9333ea',
        iconBg: 'rgba(147, 51, 234, 0.12)',
        Icon: TrendingDown,
      },
      {
        label: 'Avg Order Value',
        value: formatCurrency(metrics.avgOrderValue),
        helper: metrics.totalOrders ? 'Based on current orders' : 'No orders yet',
        iconColor: '#f97316',
        iconBg: 'rgba(249, 115, 22, 0.12)',
        Icon: CircleDollarSign,
      },
    ],
    [metrics]
  );

  // Apply the search box and type filter before rendering rows
  const filteredOrders = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesType = typeFilter === 'All' || order.type === typeFilter;
      if (!matchesType) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      const fields = [order.orderNumber, order.supplierName, order.customerName];
      return fields.some((field) => field && field.toString().toLowerCase().includes(normalized));
    });
  }, [orders, searchTerm, typeFilter]);

  // Calculate quick totals for the dialog footer
  const orderTotals = useMemo(() => {
    const subtotal = formData.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const itemCount = formData.items.reduce((acc, item) => acc + item.quantity, 0);
    return { subtotal, itemCount };
  }, [formData.items]);

  // Reset the dialog state before showing the create form
  const handleAddClick = () => {
    setFormData({ type: 'Sales', supplierId: '', customerName: '', items: [] });
    setSelectedProduct('');
    setSelectedQuantity('');
    setSelectedPrice('');
    setFormError('');
    setOpenDialog(true);
  };

  // Close the dialog and clear inline errors
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  // Sync simple text fields into the form state
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Append a product row to the pending order
  const handleAddItem = () => {
    const quantityNumber = Number(selectedQuantity);
    const priceNumber = Number(selectedPrice);
    if (!selectedProduct || Number.isNaN(quantityNumber) || Number.isNaN(priceNumber) || quantityNumber <= 0 || priceNumber <= 0) {
      setFormError('Provide a product, positive quantity, and unit price');
      return;
    }
    const product = products.find((item) => item.id === selectedProduct);
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: selectedProduct,
          productName: product?.name,
          quantity: quantityNumber,
          unitPrice: priceNumber,
        },
      ],
    });
    setSelectedProduct('');
    setSelectedQuantity('');
    setSelectedPrice('');
    setFormError('');
  };

  // Remove an item by index from the draft order
  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  // Validate and submit the dialog form
  const handleSave = async () => {
    if (formData.type === 'Purchase' && !formData.supplierId) {
      setFormError('Select a supplier for purchase orders');
      return;
    }
    if (formData.type === 'Sales' && !formData.customerName.trim()) {
      setFormError('Enter a customer name for sales orders');
      return;
    }
    if (formData.items.length === 0) {
      setFormError('Add at least one order item');
      return;
    }
    try {
      const orderPayload = {
        type: formData.type,
        supplierId: formData.type === 'Purchase' ? formData.supplierId || null : null,
        customerName: formData.type === 'Sales' ? formData.customerName.trim() : '',
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };
      await axiosClient.post(API_ENDPOINTS.ORDERS.CREATE, orderPayload);
      await fetchData();
      setOpenDialog(false);
      setFormError('');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create order');
    }
  };

  // Delete an order after confirming with the user
  const handleDelete = async (id) => {
    if (window.confirm('Remove this order?')) {
      try {
        await axiosClient.delete(API_ENDPOINTS.ORDERS.DELETE(id));
        await fetchData();
      } catch (err) {
        setBannerError('Failed to delete order');
      }
    }
  };

  // Clear the search bar and type dropdown
  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
  };

  const filteredRows = filteredOrders.map((order) => ({
    id: order.id,
    ...order,
  }));

  // Column definitions for the main table
  const columns = [
    { field: 'orderNumber', headerName: 'Order #', width: 150 },
    {
      field: 'orderDate',
      headerName: 'Date',
      width: 140,
      valueFormatter: ({ value }) => formatDate(value),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          label={value === 'Sales' ? 'Sales Order' : 'Purchase Order'}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: value === 'Sales' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(147, 51, 234, 0.12)',
            color: value === 'Sales' ? '#2563eb' : '#9333ea',
          }}
        />
      ),
    },
    { field: 'supplierName', headerName: 'Supplier', width: 180 },
    { field: 'customerName', headerName: 'Customer', width: 180 },
    {
      field: 'totalAmount',
      headerName: 'Total Amount',
      width: 150,
      valueFormatter: ({ value }) => formatCurrency(value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        isAdmin ? (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Trash2 size={16} strokeWidth={1.8} />}
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        ) : null,
    },
  ];

  // First-load spinner while we fetch everything
  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handy flags for conditional UI pieces
  const filtersApplied = Boolean(searchTerm.trim() || typeFilter !== 'All');
  const showEmptyState = !loading && filteredRows.length === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Orders</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '42rem' }}>
          Review order flow, reconcile supplier deliveries, and create new sales or purchase orders on demand.
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
          placeholder="Search orders"
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
          <InputLabel>Order type</InputLabel>
          <Select value={typeFilter} label="Order type" onChange={(event) => setTypeFilter(event.target.value)}>
            <MenuItem value="All">All orders</MenuItem>
            <MenuItem value="Sales">Sales orders</MenuItem>
            <MenuItem value="Purchase">Purchase orders</MenuItem>
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
              {filtersApplied ? 'No orders match your filters' : 'No orders yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filtersApplied
                ? 'Try adjusting your filters or search term to see more results.'
                : 'Create a sales or purchase order to start tracking inventory movement.'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {filtersApplied && (
              <Button variant="outlined" onClick={handleResetFilters}>
                Clear filters
              </Button>
            )}
            <Button variant="contained" startIcon={<Plus size={18} strokeWidth={1.8} />} onClick={handleAddClick}>
              Create order
            </Button>
          </Box>
        </Paper>
      ) : (
        <MainTable
          title="Order Activity"
          columns={columns}
          rows={filteredRows}
          loading={loading}
          toolbar={
            <Button variant="contained" startIcon={<Plus size={18} strokeWidth={1.8} />} onClick={handleAddClick}>
              Create order
            </Button>
          }
        />
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1.5rem',
            p: '0.75rem',
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Create new order
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Box sx={{ display: 'grid', gap: '1rem', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <FormControl fullWidth>
              <InputLabel>Order type</InputLabel>
              <Select name="type" value={formData.type} onChange={handleInputChange} label="Order type">
                <MenuItem value="Sales">Sales order</MenuItem>
                <MenuItem value="Purchase">Purchase order</MenuItem>
              </Select>
            </FormControl>
            {formData.type === 'Purchase' ? (
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select name="supplierId" value={formData.supplierId} onChange={handleInputChange} label="Supplier">
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Customer name"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                fullWidth
              />
            )}
          </Box>

          {formError && <Alert severity="error">{formError}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Order items
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: '0.75rem',
                gridTemplateColumns: { xs: 'repeat(auto-fit, minmax(160px, 1fr))', md: '2fr repeat(2, minmax(150px, 1fr)) auto' },
                alignItems: 'center',
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)} label="Product">
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Quantity"
                type="number"
                value={selectedQuantity}
                onChange={(event) => setSelectedQuantity(event.target.value)}
                fullWidth
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Unit price"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                value={selectedPrice}
                onChange={(event) => setSelectedPrice(event.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={handleAddItem}
                disabled={!selectedProduct || !selectedQuantity || !selectedPrice}
                sx={{ width: { xs: '100%', md: 'auto' }, justifySelf: { xs: 'stretch', md: 'end' }, whiteSpace: 'nowrap' }}
              >
                Add item
              </Button>
            </Box>
          </Box>

          {formData.items.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Paper sx={{ borderRadius: '1rem', border: '1px solid #e2e8f0', minWidth: 560 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell width={48}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={`${item.productId}-${index}`}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleRemoveItem(index)} aria-label="Remove item">
                            <Trash2 size={16} strokeWidth={1.8} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {orderTotals.itemCount ? `${orderTotals.itemCount} items` : 'No items added yet'}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {formatCurrency(orderTotals.subtotal)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: '1.75rem', pb: '1.5rem' }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={formData.items.length === 0}>
            Create order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
