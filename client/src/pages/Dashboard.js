import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Package2, ClipboardList, Truck, AlertTriangle, CircleDollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { formatCurrency } from '../utils/currencyFormatter';

const Dashboard = () => {
  // Store the summary numbers and chart data we show on the dashboard
  const [data, setData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSuppliers: 0,
    lowStockProducts: [],
    inventoryValue: 0,
    salesValue: 0,
    purchaseValue: 0,
    avgOrderValue: 0,
    monthlyTrend: [],
    supplierRollup: [],
    lowStockValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Grab all dashboard data in one go when the page mounts
    const fetchDashboardData = async () => {
      try {
        // Pull products, orders, and suppliers together so the cards stay in sync
        const [productsRes, ordersRes, suppliersRes] = await Promise.all([
          axiosClient.get(API_ENDPOINTS.PRODUCTS.GET_ALL),
          axiosClient.get(API_ENDPOINTS.ORDERS.GET_ALL),
          axiosClient.get(API_ENDPOINTS.SUPPLIERS.GET_ALL),
        ]);

        const products = productsRes.data.data || [];
        const orders = ordersRes.data.data || [];
        const suppliers = suppliersRes.data.data || [];
        const lowStock = products.filter((product) => {
          const quantity = Number(product.quantity) || 0;
          const reorderLevel = Number(product.reorderLevel) || 0;
          return quantity > 0 && quantity <= reorderLevel;
        });

        // Calculate stock value for high-level KPIs
        const inventoryValue = products.reduce((acc, product) => {
          const quantity = Number(product.quantity) || 0;
          const unitPrice = Number(product.unitPrice) || 0;
          return acc + quantity * unitPrice;
        }, 0);

        const lowStockValue = lowStock.reduce((acc, product) => {
          const quantity = Number(product.quantity) || 0;
          const unitPrice = Number(product.unitPrice) || 0;
          return acc + quantity * unitPrice;
        }, 0);

        // Split orders into sales vs purchases for charts and helpers
        const salesValue = orders
          .filter((order) => order.type === 'Sales')
          .reduce((acc, order) => acc + (Number(order.totalAmount) || 0), 0);
        const purchaseValue = orders
          .filter((order) => order.type === 'Purchase')
          .reduce((acc, order) => acc + (Number(order.totalAmount) || 0), 0);
        const totalOrderValue = salesValue + purchaseValue;
        const avgOrderValue = orders.length ? totalOrderValue / orders.length : 0;

        const monthBuckets = [];
        const monthKeyMap = {};
        for (let i = 5; i >= 0; i -= 1) {
          const date = new Date();
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          const label = date.toLocaleString('en-IN', { month: 'short' });
          monthBuckets.push({ key, label });
          monthKeyMap[key] = { month: label, sales: 0, purchases: 0 };
        }

        // Roll each order into the correct monthly bucket
        orders.forEach((order) => {
          if (!order.orderDate) {
            return;
          }
          const orderDate = new Date(order.orderDate);
          if (Number.isNaN(orderDate.getTime())) {
            return;
          }
          const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
          if (!monthKeyMap[key]) {
            return;
          }
          if (order.type === 'Sales') {
            monthKeyMap[key].sales += Number(order.totalAmount) || 0;
          } else if (order.type === 'Purchase') {
            monthKeyMap[key].purchases += Number(order.totalAmount) || 0;
          }
        });

        const monthlyTrend = monthBuckets.map((bucket) => monthKeyMap[bucket.key]);

        // Aggregate supplier purchase volumes to spotlight top vendors
        const supplierVolumeMap = new Map();
        orders
          .filter((order) => order.type === 'Purchase')
          .forEach((order) => {
            const key = order.supplierName || 'Unassigned';
            const current = supplierVolumeMap.get(key) || { name: key, orders: 0, volume: 0 };
            current.orders += 1;
            current.volume += Number(order.totalAmount) || 0;
            supplierVolumeMap.set(key, current);
          });
        const supplierRollup = Array.from(supplierVolumeMap.values())
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 4);

        setData({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalSuppliers: suppliers.length,
          lowStockProducts: lowStock.slice(0, 5),
          inventoryValue,
          salesValue,
          purchaseValue,
          avgOrderValue,
          monthlyTrend,
          supplierRollup,
          lowStockValue,
        });
        setError('');
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Keep the layout light while we wait for the API
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome back, {user?.username || 'Operator'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '36rem' }}>
          Monitor India-focused inventory health, track order cashflows, and keep suppliers aligned with demand spikes.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardCard
            title="Total Products"
            value={data.totalProducts}
            icon={Package2}
            accent="primary"
            helper={`₹ value: ${formatCurrency(data.inventoryValue)}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardCard
            title="Open Orders"
            value={data.totalOrders}
            icon={ClipboardList}
            accent="secondary"
            helper={`Avg ticket: ${formatCurrency(data.avgOrderValue)}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardCard
            title="Suppliers"
            value={data.totalSuppliers}
            icon={Truck}
            accent="success"
            helper={`Top vendors: ${data.supplierRollup.length}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <DashboardCard
            title="Low Stock"
            value={data.lowStockProducts.length}
            icon={AlertTriangle}
            accent="warning"
            helper={`Risk value: ${formatCurrency(data.lowStockValue)}`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 360 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Sales vs Purchases (last 6 months)</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Realised order value trend in Indian Rupees
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.monthlyTrend} margin={{ left: -16, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend verticalAlign="top" align="right" height={24} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Sales" />
                <Line type="monotone" dataKey="purchases" stroke="#9333ea" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Purchases" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 360 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(249, 115, 22, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f97316',
                }}
              >
                <AlertTriangle size={22} strokeWidth={1.8} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Low Stock Alerts</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Top items needing replenishment</Typography>
              </Box>
            </Box>
            <Divider />
            {data.lowStockProducts.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {data.lowStockProducts.map((product) => (
                  <Box
                    key={product.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      rowGap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {product.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        SKU: {product.sku || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flex: '1 1 140px', minWidth: 140 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                        {product.quantity} in stock
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Reorder at {product.reorderLevel}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Value: {formatCurrency((Number(product.quantity) || 0) * (Number(product.unitPrice) || 0))}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', py: '2.5rem' }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(22, 163, 74, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                  }}
                >
                  <CircleDollarSign size={24} strokeWidth={1.8} />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 220 }}>
                  Stock coverage is healthy across the portfolio. No low stock alerts right now.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 360 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <CircleDollarSign size={22} strokeWidth={1.8} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Working Capital Pulse</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sales vs purchase throughput for the rolling quarter
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sales booked</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatCurrency(data.salesValue)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Purchases committed</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>{formatCurrency(data.purchaseValue)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Average order value</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(data.avgOrderValue)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Net flow</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: data.salesValue - data.purchaseValue >= 0 ? 'success.main' : 'error.main' }}>
                    {formatCurrency(data.salesValue - data.purchaseValue)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 360 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(147, 51, 234, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9333ea',
                }}
              >
                <TrendingUp size={22} strokeWidth={1.8} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Top Purchase Partners</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Track spend concentration across suppliers
                </Typography>
              </Box>
            </Box>
            {data.supplierRollup.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {data.supplierRollup.map((supplier) => (
                  <Box
                    key={supplier.name}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      rowGap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{supplier.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{supplier.orders} purchase orders</Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flex: '1 1 120px', minWidth: 140 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(supplier.volume)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>YTD value</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', py: '2.5rem' }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                  }}
                >
                  <TrendingDown size={24} strokeWidth={1.8} />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 220 }}>
                  No purchase orders recorded yet. Log supplier transactions to unlock spend insights.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
