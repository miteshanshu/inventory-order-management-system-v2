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
  Grid,
  Paper,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package2,
  AlertTriangle,
  CircleDollarSign,
  ClipboardList,
} from 'lucide-react';
import MainTable from '../components/MainTable';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { formatCurrency } from '../utils/currencyFormatter';

const Products = () => {
  // --- Basic state setup ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState('');
  const [formError, setFormError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // form state for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    supplierId: '',
    quantity: '',
    reorderLevel: '',
    unitPrice: '',
  });

  // get user from local storage (to check role)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  // --- Initial data fetch ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        axiosClient.get(API_ENDPOINTS.PRODUCTS.GET_ALL),
        axiosClient.get(API_ENDPOINTS.CATEGORIES.GET_ALL),
        axiosClient.get(API_ENDPOINTS.SUPPLIERS.GET_ALL),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setBannerError('');
    } catch {
      setBannerError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // --- Quick stats for dashboard cards ---
  const metrics = useMemo(() => {
    const totalValue = products.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
      0
    );
    const lowStock = products.filter(
      (p) => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.reorderLevel)
    );
    const outStock = products.filter((p) => Number(p.quantity) === 0);
    const categoryCount = new Set(products.map((p) => p.categoryName)).size;

    return {
      totalSkus: products.length,
      inventoryValue: totalValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outStock.length,
      categoryCount,
    };
  }, [products]);

  // --- Dashboard summary cards ---
  const summaryCards = [
    {
      label: 'Total SKUs',
      value: metrics.totalSkus.toLocaleString(),
      helper: `${metrics.categoryCount} categories`,
      iconColor: '#2563eb',
      iconBg: 'rgba(37, 99, 235, 0.12)',
      Icon: Package2,
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(metrics.inventoryValue),
      helper: 'Total book value of stock',
      iconColor: '#16a34a',
      iconBg: 'rgba(22, 163, 74, 0.12)',
      Icon: CircleDollarSign,
    },
    {
      label: 'Low Stock',
      value: metrics.lowStockCount.toLocaleString(),
      helper: `${metrics.outOfStockCount} out of stock`,
      iconColor: '#f97316',
      iconBg: 'rgba(249, 115, 22, 0.12)',
      Icon: AlertTriangle,
    },
    {
      label: 'Catalog Coverage',
      value: metrics.categoryCount.toLocaleString(),
      helper: 'Active product categories',
      iconColor: '#9333ea',
      iconBg: 'rgba(147, 51, 234, 0.12)',
      Icon: ClipboardList,
    },
  ];

  // --- Prepare rows for table ---
  const rows = useMemo(
    () =>
      products.map((p) => {
        const quantity = Number(p.quantity) || 0;
        const reorder = Number(p.reorderLevel) || 0;
        const price = Number(p.unitPrice) || 0;
        const stockValue = quantity * price;
        let stockStatus = 'Healthy';
        if (quantity === 0) stockStatus = 'Out';
        else if (quantity <= reorder) stockStatus = 'Low';
        return { ...p, id: p.id, stockStatus, stockValue };
      }),
    [products]
  );

  // --- Filter logic ---
  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchCategory = categoryFilter === 'All' || row.categoryId === categoryFilter;
      const matchStock =
        stockFilter === 'All' ||
        (stockFilter === 'Healthy' && row.stockStatus === 'Healthy') ||
        (stockFilter === 'Low' && row.stockStatus === 'Low') ||
        (stockFilter === 'Out' && row.stockStatus === 'Out');

      if (!matchCategory || !matchStock) return false;
      if (!search) return true;

      const fields = [row.name, row.sku, row.categoryName, row.supplierName];
      return fields.some((f) => f && f.toLowerCase().includes(search));
    });
  }, [rows, searchTerm, categoryFilter, stockFilter]);

  const filtersApplied = Boolean(
    searchTerm.trim() || categoryFilter !== 'All' || stockFilter !== 'All'
  );

  const showEmptyState = !loading && filteredRows.length === 0;

  // --- Handlers ---
  // Open the dialog with a blank form for a new product
  const handleAddClick = () => {
    setFormData({
      name: '',
      sku: '',
      categoryId: '',
      supplierId: '',
      quantity: '',
      reorderLevel: '',
      unitPrice: '',
    });
    setEditingId(null);
    setFormError('');
    setOpenDialog(true);
  };

  // Close the modal and reset any validation message
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  // Mirror text inputs into form state
  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Clear search and dropdown filters in one go
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
    setStockFilter('All');
  };

  // Validate the form and create or update the product
  const handleSave = async () => {
    const { name, categoryId, quantity, reorderLevel, unitPrice, sku, supplierId } =
      formData;

    if (!name.trim()) return setFormError('Enter a product name');
    if (!categoryId) return setFormError('Select a category');

    const qty = Number(quantity);
    const reorder = Number(reorderLevel);
    const price = Number(unitPrice);
    if (qty < 0 || reorder < 0 || price < 0)
      return setFormError('Enter valid numeric values');

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        categoryId,
        supplierId: supplierId || null,
        quantity: qty,
        reorderLevel: reorder,
        unitPrice: price,
      };
      if (editingId)
        await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(editingId), payload);
      else await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE, payload);

      await fetchData();
      setOpenDialog(false);
      setFormError('');
    } catch {
      setFormError('Failed to save product');
    }
  };

  // Remove a product and refresh the list once the API call succeeds
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product?')) return;
    try {
      await axiosClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
      await fetchData();
    } catch {
      setBannerError('Failed to delete product');
    }
  };

  // --- Table Columns ---
  const columns = [
    { field: 'name', headerName: 'Product', flex: 1, minWidth: 180 },
    { field: 'sku', headerName: 'SKU', width: 140 },
    { field: 'categoryName', headerName: 'Category', width: 160 },
    { field: 'supplierName', headerName: 'Supplier', width: 180 },
    { field: 'quantity', headerName: 'Quantity', width: 120, align: 'right' },
    { field: 'reorderLevel', headerName: 'Reorder Level', width: 150, align: 'right' },
    {
      field: 'stockStatus',
      headerName: 'Status',
      width: 140,
      renderCell: ({ value }) => {
        const colors = {
          Healthy: { bg: 'rgba(22,163,74,0.12)', color: '#16a34a', label: 'Healthy' },
          Low: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', label: 'Low stock' },
          Out: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Out of stock' },
        };
        const c = colors[value] || colors.Healthy;
        return <Chip label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.color }} />;
      },
    },
    {
      field: 'unitPrice',
      headerName: 'Unit Price',
      width: 150,
      valueFormatter: ({ value }) => formatCurrency(value),
    },
    {
      field: 'stockValue',
      headerName: 'Stock Value',
      width: 160,
      valueFormatter: ({ value }) => formatCurrency(value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: (params) =>
        isAdmin && (
          <Box sx={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Pencil size={16} />}
              onClick={() => {
                setEditingId(params.row.id);
                setFormData({
                  name: params.row.name,
                  sku: params.row.sku || '',
                  categoryId: params.row.categoryId,
                  supplierId: params.row.supplierId || '',
                  quantity: params.row.quantity,
                  reorderLevel: params.row.reorderLevel,
                  unitPrice: params.row.unitPrice,
                });
                setOpenDialog(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Trash2 size={16} />}
              onClick={() => handleDelete(params.row.id)}
            >
              Delete
            </Button>
          </Box>
        ),
    },
  ];

  // First-load spinner to avoid flashing empty content
  if (loading && products.length === 0)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );

  // --- UI starts here ---
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page heading */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Products
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage SKUs, monitor reorder levels, and maintain stock health.
        </Typography>
      </Box>

      {/* Summary metrics cards */}
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
                <card.Icon size={22} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
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

      {/* --- Filter section fixed for UI layout --- */}
      <Paper
        sx={{
          p: '1.25rem',
          borderRadius: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextField
          placeholder="Search products"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="All">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Stock status</InputLabel>
          <Select
            value={stockFilter}
            label="Stock status"
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <MenuItem value="All">All statuses</MenuItem>
            <MenuItem value="Healthy">Healthy</MenuItem>
            <MenuItem value="Low">Low stock</MenuItem>
            <MenuItem value="Out">Out of stock</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={handleResetFilters}
          disabled={!filtersApplied}
          sx={{
            minWidth: 140,
            whiteSpace: 'nowrap',
            height: 'fit-content',
          }}
        >
          Reset filters
        </Button>
      </Paper>

      {/* Error banner */}
      {bannerError && <Alert severity="error">{bannerError}</Alert>}

      {/* Empty or Data Table */}
      {showEmptyState ? (
        <Paper
          sx={{
            p: '3rem',
            borderRadius: '1rem',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {filtersApplied ? 'No products match your filters' : 'No products yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {filtersApplied
              ? 'Try changing filters or search keywords.'
              : 'Add your first product to start tracking.'}
          </Typography>
          <Box>
            {filtersApplied && (
              <Button variant="outlined" onClick={handleResetFilters}>
                Clear filters
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={handleAddClick}
                sx={{ ml: 1 }}
              >
                Add product
              </Button>
            )}
          </Box>
        </Paper>
      ) : (
        <MainTable
          title="Product Catalog"
          columns={columns}
          rows={filteredRows}
          loading={loading}
          toolbar={
            isAdmin && (
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={handleAddClick}
              >
                Add product
              </Button>
            )
          }
        />
      )}

      {/* Add/Edit Product Modal */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', mt: 1 }}>
            <TextField
              label="Product name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
              >
                <MenuItem value="">None</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box
              sx={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              }}
            >
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
              />
              <TextField
                label="Reorder level"
                name="reorderLevel"
                type="number"
                value={formData.reorderLevel}
                onChange={handleInputChange}
              />
              <TextField
                label="Unit price"
                name="unitPrice"
                type="number"
                inputProps={{ step: '0.01' }}
                value={formData.unitPrice}
                onChange={handleInputChange}
              />
            </Box>
            {formError && <Alert severity="error">{formError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
