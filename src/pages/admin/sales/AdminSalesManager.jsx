/* ==========================================================================
   FLOCARD — Sales Management, Sales Ledger & Product-wise Sales Tracking
   Fully functional accounting module integrated with FLOCARD storage & orders.
   ========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  Package,
  Layers,
  Radio,
  BarChart3,
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
  Settings,
  Calendar,
  ExternalLink,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import InvoiceModal from './InvoiceModal';

export default function AdminSalesManager({ defaultTab = 'overview', initialOrderId = null }) {
  const {
    orders = [],
    products = [],
    invoiceSettings,
    saveInvoiceSettings,
    recordOrderPayment,
    recordOrderRefund,
    recordFinancialAdjustment,
    updateOrderStatus
  } = useData();

  const { user } = useAuth();
  const adminEmail = user?.email || 'admin@flocard.in';
  const adminName = user?.name || 'Administrator';

  // Sub-navigation tabs
  const [activeSection, setActiveSection] = useState(
    defaultTab === 'product-sales' ? 'products' : (defaultTab === 'ledger' ? 'ledger' : 'overview')
  );

  // Date Filter Range State
  const [datePreset, setDatePreset] = useState('all'); // 'today', 'yesterday', '7days', '30days', 'this_month', 'last_month', 'custom', 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Ledger Filter & Search State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [sortField, setSortField] = useState('date'); // 'date' | 'amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Order for Transaction View / Invoice
  const [selectedTransactionOrder, setSelectedTransactionOrder] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);

  // Product Drilldown Report State
  const [drilldownProduct, setDrilldownProduct] = useState(null);

  // Action Modals (Payment / Refund / Adjustment)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'upi', reference: '', note: '' });

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({ type: 'discount', amount: '', reason: '' });

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Invoice Settings Form State
  const [invSettingsForm, setInvSettingsForm] = useState(() => invoiceSettings || {});
  const [invSettingsSaved, setInvSettingsSaved] = useState(false);

  // If initialOrderId provided, open transaction modal directly
  React.useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const found = orders.find(o => o.id === initialOrderId || o.orderReference === initialOrderId);
      if (found) setSelectedTransactionOrder(found);
    }
  }, [initialOrderId, orders]);

  // Keep transaction order fresh when data updates
  React.useEffect(() => {
    if (selectedTransactionOrder) {
      const fresh = orders.find(o => o.id === selectedTransactionOrder.id);
      if (fresh) setSelectedTransactionOrder(fresh);
    }
  }, [orders]);

  // Keep invoice settings form updated when store changes
  React.useEffect(() => {
    if (invoiceSettings) setInvSettingsForm(invoiceSettings);
  }, [invoiceSettings]);

  // =========================================================================
  // DATE RANGE FILTER ENGINE
  // =========================================================================
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'today') {
      return { start: startOfToday, end: endOfToday, label: 'Today' };
    }
    if (datePreset === 'yesterday') {
      const yStart = new Date(startOfToday.getTime() - 86400000);
      const yEnd = new Date(endOfToday.getTime() - 86400000);
      return { start: yStart, end: yEnd, label: 'Yesterday' };
    }
    if (datePreset === '7days') {
      const s = new Date(startOfToday.getTime() - 6 * 86400000);
      return { start: s, end: endOfToday, label: 'Last 7 Days' };
    }
    if (datePreset === '30days') {
      const s = new Date(startOfToday.getTime() - 29 * 86400000);
      return { start: s, end: endOfToday, label: 'Last 30 Days' };
    }
    if (datePreset === 'this_month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: s, end: e, label: 'This Month' };
    }
    if (datePreset === 'last_month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: s, end: e, label: 'Last Month' };
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      const s = new Date(customStartDate + 'T00:00:00');
      const e = new Date(customEndDate + 'T23:59:59');
      return { start: s, end: e, label: `${customStartDate} to ${customEndDate}` };
    }
    // Default 'all'
    return { start: new Date(2020, 0, 1), end: new Date(2035, 11, 31), label: 'All Time' };
  }, [datePreset, customStartDate, customEndDate]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.orderDate || o.createdAt || Date.now());
      return d >= dateRangeBounds.start && d <= dateRangeBounds.end;
    });
  }, [orders, dateRangeBounds]);

  // Opening & Closing Balance calculations
  const accountingBalance = useMemo(() => {
    let openingBalance = 0;
    orders.forEach(o => {
      const d = new Date(o.orderDate || o.createdAt || Date.now());
      if (d < dateRangeBounds.start && o.status !== 'cancelled') {
        const gross = Number(o.totalAmount || 0);
        const refunds = Number(o.refundAmount || 0);
        openingBalance += (gross - refunds);
      }
    });

    let periodGross = 0;
    let periodRefunds = 0;
    filteredOrders.forEach(o => {
      if (o.status !== 'cancelled') {
        periodGross += Number(o.totalAmount || 0);
        periodRefunds += Number(o.refundAmount || 0);
      }
    });

    const closingBalance = openingBalance + periodGross - periodRefunds;

    return {
      openingBalance: Math.max(0, openingBalance),
      periodGross,
      periodRefunds,
      closingBalance: Math.max(0, closingBalance)
    };
  }, [orders, filteredOrders, dateRangeBounds]);

  // =========================================================================
  // SALES OVERVIEW KPI METRICS
  // =========================================================================
  const kpiMetrics = useMemo(() => {
    let totalSales = 0;
    let totalOrders = 0;
    let totalProductsSold = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    let pendingPayments = 0;

    filteredOrders.forEach(o => {
      if (o.status === 'cancelled') return;

      totalOrders += 1;
      const qty = Number(o.quantity || (o.items?.reduce((s, it) => s + (Number(it.quantity) || 1), 0)) || 1);
      totalProductsSold += qty;

      const gross = Number(o.totalAmount || 0);
      const discount = Number(o.discount || 0);
      const refund = Number(o.refundAmount || 0);
      const paid = Number(o.amountPaid !== undefined ? o.amountPaid : (o.paymentStatus === 'paid' ? gross : 0));
      const outstanding = Number(o.amountOutstanding !== undefined ? o.amountOutstanding : Math.max(0, gross - paid - refund));

      totalSales += gross;
      totalDiscounts += discount;
      totalRefunds += refund;

      if (o.paymentStatus === 'pending' || o.paymentStatus === 'partially_paid') {
        pendingPayments += outstanding;
      }
    });

    const netSales = Math.max(0, totalSales - totalRefunds);
    const aov = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      totalSales,
      totalOrders,
      totalProductsSold,
      netSales,
      pendingPayments,
      totalRefunds,
      totalDiscounts,
      aov
    };
  }, [filteredOrders]);

  // =========================================================================
  // LEDGER FILTERING, SEARCH, SORTING & PAGINATION
  // =========================================================================
  const ledgerRecords = useMemo(() => {
    let result = [...filteredOrders];

    // Search query
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase().trim();
      result = result.filter(o =>
        (o.invoiceId || '').toLowerCase().includes(q) ||
        (o.orderReference || o.id || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q) ||
        (o.cardCode || '').toLowerCase().includes(q) ||
        (o.items && o.items.some(it => (it.productName || it.sku || '').toLowerCase().includes(q)))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.paymentStatus === statusFilter);
    }

    // Payment method filter
    if (methodFilter !== 'all') {
      result = result.filter(o => (o.paymentMethod || 'upi').toLowerCase() === methodFilter);
    }

    // Product edition filter
    if (productFilter !== 'all') {
      result = result.filter(o => (o.edition || 'purple').toLowerCase() === productFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'date') {
        const dA = new Date(a.orderDate || a.createdAt || 0);
        const dB = new Date(b.orderDate || b.createdAt || 0);
        return sortOrder === 'desc' ? dB - dA : dA - dB;
      }
      if (sortField === 'amount') {
        const valA = Number(a.totalAmount || 0);
        const valB = Number(b.totalAmount || 0);
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      return 0;
    });

    return result;
  }, [filteredOrders, ledgerSearch, statusFilter, methodFilter, productFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(ledgerRecords.length / rowsPerPage) || 1;
  const paginatedLedger = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return ledgerRecords.slice(start, start + rowsPerPage);
  }, [ledgerRecords, currentPage, rowsPerPage]);

  // =========================================================================
  // PRODUCT-WISE SALES BREAKDOWN
  // =========================================================================
  const productSalesMap = useMemo(() => {
    const catalog = [
      {
        id: 'gold',
        edition: 'gold',
        name: 'Gold Edition NFC Card',
        sku: 'FLC-CRD-GLD-01',
        variant: '24K Metallic Champagne Gold',
        image: '/assets/cardbg-gold.png',
        price: 2499,
        stock: 45
      },
      {
        id: 'platinum',
        edition: 'platinum',
        name: 'Platinum Edition NFC Card',
        sku: 'FLC-CRD-PLT-02',
        variant: 'Brushed Platinum & Silver',
        image: '/assets/cardbg-platinum.png',
        price: 2999,
        stock: 32
      },
      {
        id: 'purple',
        edition: 'purple',
        name: 'Purple Edition NFC Card',
        sku: 'FLC-CRD-PRP-03',
        variant: 'Ultraviolet Signature Obsidian',
        image: '/assets/cardbg-purple.png',
        price: 1899,
        stock: 68
      },
      {
        id: 'metal',
        edition: 'metal',
        name: 'Metal Edition NFC Card',
        sku: 'FLC-CRD-MTL-04',
        variant: 'Brushed Gunmetal & Laser White',
        image: '/assets/cardbg-metal.png',
        price: 3499,
        stock: 18
      }
    ];

    // Merge with products in store if configured
    products.forEach(p => {
      const idx = catalog.findIndex(c => c.edition === p.edition);
      if (idx >= 0) {
        catalog[idx] = { ...catalog[idx], ...p };
      } else {
        catalog.push({
          id: p.id || p.edition,
          edition: p.edition,
          name: p.name,
          sku: p.sku || `FLC-CRD-${p.edition.slice(0, 3).toUpperCase()}-99`,
          variant: p.material || 'Custom NFC Edition',
          image: p.previewImage || '/assets/cardbg-purple.png',
          price: p.price || 1999,
          stock: p.stock || 50
        });
      }
    });

    const result = catalog.map(prod => {
      const matchingOrders = filteredOrders.filter(o => {
        if (o.edition === prod.edition) return true;
        if (o.items && o.items.some(it => it.edition === prod.edition || it.sku === prod.sku)) return true;
        return false;
      });

      let totalUnits = 0;
      let totalRevenue = 0;
      let totalDiscounts = 0;
      let totalRefunds = 0;

      matchingOrders.forEach(o => {
        if (o.status === 'cancelled') return;
        const matchingItem = o.items?.find(it => it.edition === prod.edition || it.sku === prod.sku);
        const qty = matchingItem ? Number(matchingItem.quantity || 1) : Number(o.quantity || 1);
        const revenue = matchingItem ? Number(matchingItem.total || (matchingItem.unitPrice * qty)) : Number(o.totalAmount || prod.price);
        const discount = matchingItem ? Number(matchingItem.discount || 0) : Number(o.discount || 0);
        const refund = Number(o.refundAmount || 0);

        totalUnits += qty;
        totalRevenue += revenue;
        totalDiscounts += discount;
        totalRefunds += refund;
      });

      const netSales = Math.max(0, totalRevenue - totalRefunds);

      return {
        ...prod,
        ordersCount: matchingOrders.length,
        totalUnits,
        totalRevenue,
        totalDiscounts,
        totalRefunds,
        netSales,
        orders: matchingOrders
      };
    });

    return result;
  }, [filteredOrders, products]);

  // =========================================================================
  // EXPORT UTILITIES (CSV & EXCEL)
  // =========================================================================
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Invoice ID',
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Product Name',
      'Product Code / SKU',
      'Quantity',
      'Unit Price',
      'Discount',
      'Tax',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Amount Paid',
      'Amount Outstanding',
      'Refund Amount',
      'Transaction Ref'
    ];

    const rows = ledgerRecords.map(o => {
      const item = o.items?.[0] || {};
      return [
        new Date(o.orderDate || o.createdAt).toISOString().split('T')[0],
        `"${o.invoiceId || ''}"`,
        `"${o.orderReference || o.id}"`,
        `"${o.customerName || ''}"`,
        `"${o.customerEmail || ''}"`,
        `"${item.productName || o.edition || 'NFC Card'}"`,
        `"${item.sku || o.cardCode || ''}"`,
        o.quantity || 1,
        o.unitPrice || o.totalAmount,
        o.discount || 0,
        o.tax || 0,
        o.totalAmount,
        (o.paymentMethod || 'UPI').toUpperCase(),
        (o.paymentStatus || 'PAID').toUpperCase(),
        o.amountPaid || 0,
        o.amountOutstanding || 0,
        o.refundAmount || 0,
        `"${o.transactionReference || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FLOCARD_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const tableHeader = `
      <tr>
        <th>Date</th>
        <th>Invoice ID</th>
        <th>Order ID</th>
        <th>Customer</th>
        <th>Product</th>
        <th>SKU</th>
        <th>Quantity</th>
        <th>Unit Price (INR)</th>
        <th>Discount (INR)</th>
        <th>Tax (INR)</th>
        <th>Total Amount (INR)</th>
        <th>Payment Method</th>
        <th>Payment Status</th>
        <th>Paid (INR)</th>
        <th>Outstanding (INR)</th>
        <th>Refunded (INR)</th>
      </tr>
    `;

    const tableRows = ledgerRecords.map(o => {
      const it = o.items?.[0] || {};
      return `
        <tr>
          <td>${new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN')}</td>
          <td>${o.invoiceId || ''}</td>
          <td>${o.orderReference || o.id}</td>
          <td>${o.customerName || ''}</td>
          <td>${it.productName || o.edition || ''}</td>
          <td>${it.sku || ''}</td>
          <td>${o.quantity || 1}</td>
          <td>${o.unitPrice || o.totalAmount}</td>
          <td>${o.discount || 0}</td>
          <td>${o.tax || 0}</td>
          <td>${o.totalAmount}</td>
          <td>${(o.paymentMethod || 'UPI').toUpperCase()}</td>
          <td>${(o.paymentStatus || 'PAID').toUpperCase()}</td>
          <td>${o.amountPaid || 0}</td>
          <td>${o.amountOutstanding || 0}</td>
          <td>${o.refundAmount || 0}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8" /></head>
        <body>
          <h2>FLOCARD Connected Identity Systems — Sales Ledger</h2>
          <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
          <table border="1">${tableHeader}${tableRows}</table>
        </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FLOCARD_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // FINANCIAL MUTATION HANDLERS
  // =========================================================================
  const handleRecordPayment = (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const num = Number(paymentForm.amount);
      if (!num || num <= 0) throw new Error('Please enter a valid positive payment amount.');

      const updated = recordOrderPayment({
        orderId: selectedTransactionOrder.id,
        amount: num,
        method: paymentForm.method,
        reference: paymentForm.reference,
        note: paymentForm.note,
        recordedBy: `${adminName} (${adminEmail})`
      });

      setSelectedTransactionOrder(updated);
      setPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'upi', reference: '', note: '' });
      setActionSuccess(`Payment of ₹${num.toLocaleString('en-IN')} recorded successfully.`);
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError(err.message || 'Failed to record payment.');
    }
  };

  const handleRecordRefund = (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const num = Number(refundForm.amount);
      if (!num || num <= 0) throw new Error('Please enter a valid positive refund amount.');
      if (!refundForm.reason.trim()) throw new Error('A detailed reason is strictly required to process a refund.');

      const updated = recordOrderRefund({
        orderId: selectedTransactionOrder.id,
        amount: num,
        reason: refundForm.reason.trim(),
        recordedBy: `${adminName} (${adminEmail})`
      });

      setSelectedTransactionOrder(updated);
      setRefundModalOpen(false);
      setRefundForm({ amount: '', reason: '' });
      setActionSuccess(`Refund of ₹${num.toLocaleString('en-IN')} processed successfully.`);
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError(err.message || 'Failed to process refund.');
    }
  };

  const handleRecordAdjustment = (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const num = Number(adjustmentForm.amount);
      if (!num || num === 0) throw new Error('Please enter a non-zero adjustment amount.');
      if (!adjustmentForm.reason.trim()) throw new Error('A reason is mandatory for financial adjustments.');

      const updated = recordFinancialAdjustment({
        orderId: selectedTransactionOrder.id,
        type: adjustmentForm.type,
        amount: num,
        reason: adjustmentForm.reason.trim(),
        recordedBy: `${adminName} (${adminEmail})`
      });

      setSelectedTransactionOrder(updated);
      setAdjustmentModalOpen(false);
      setAdjustmentForm({ type: 'discount', amount: '', reason: '' });
      setActionSuccess(`Financial adjustment applied successfully.`);
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError(err.message || 'Failed to apply adjustment.');
    }
  };

  const handleSaveInvoiceSettings = (e) => {
    e.preventDefault();
    saveInvoiceSettings(invSettingsForm, adminEmail);
    setInvSettingsSaved(true);
    setTimeout(() => setInvSettingsSaved(false), 4000);
  };

  // Status badges helper
  const renderPaymentBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Partially Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <RotateCcw className="w-3 h-3" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header Banner & Sub-Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-purple-500/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Receipt className="w-4 h-4" />
            FLOCARD Financial & Revenue Center
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Management & Product Ledger</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Accounting-grade double-entry ledger, product tracking, invoice generator, and physical NFC card telemetry.
          </p>
        </div>

        {/* Global Date Range Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0C0717] p-1.5 rounded-xl border border-purple-500/20">
          <Calendar className="w-4 h-4 text-purple-400 ml-2 mr-1" />
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom' },
            { id: 'all', label: 'All Time' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => {
                setDatePreset(p.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                datePreset === p.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Pickers if 'custom' selected */}
      {datePreset === 'custom' && (
        <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-purple-300 font-medium">Custom Range:</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-[#120B22] border border-purple-500/20 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-[#120B22] border border-purple-500/20 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <span className="text-zinc-500 text-[11px]">Filtered {filteredOrders.length} records</span>
        </div>
      )}

      {/* Module Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-purple-500/10 pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Sales Overview', icon: LayoutDashboardIcon },
          { id: 'ledger', label: 'Sales Ledger', icon: Receipt, badge: filteredOrders.length },
          { id: 'products', label: 'Product-wise Sales', icon: Layers, badge: productSalesMap.length },
          { id: 'cards', label: 'Physical Card Tracking', icon: Radio },
          { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Invoice Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-600/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 text-purple-400" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-purple-500 text-white' : 'bg-white/10 text-zinc-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* 1. SALES OVERVIEW DASHBOARD */}
      {/* =================================================================== */}
      {activeSection === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Summary KPI Cards Grid (6 Main Cards as Specified in Prompt) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 1. Total Sales */}
            <div className="p-5 rounded-2xl bg-[#0D0819] border border-purple-500/15 hover:border-purple-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Sales</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-white tracking-tight">₹{kpiMetrics.totalSales.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-zinc-500 mt-1">Completed order gross revenue</p>
            </div>

            {/* 2. Total Orders */}
            <div className="p-5 rounded-2xl bg-[#0D0819] border border-purple-500/15 hover:border-purple-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Orders</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{kpiMetrics.totalOrders}</div>
              <p className="text-[11px] text-zinc-500 mt-1">Orders in selected period</p>
            </div>

            {/* 3. Total Products Sold */}
            <div className="p-5 rounded-2xl bg-[#0D0819] border border-purple-500/15 hover:border-purple-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Products Sold</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{kpiMetrics.totalProductsSold} Cards</div>
              <p className="text-[11px] text-zinc-500 mt-1">Total physical cards sold</p>
            </div>

            {/* 4. Net Sales */}
            <div className="p-5 rounded-2xl bg-[#0D0819] border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Net Sales</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-400 tracking-tight">₹{kpiMetrics.netSales.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-zinc-500 mt-1">After discounts & refunds</p>
            </div>

            {/* 5. Pending Payments */}
            <div className="p-5 rounded-2xl bg-[#0D0819] border border-amber-500/20 hover:border-amber-500/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Pending</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-amber-400 tracking-tight">₹{kpiMetrics.pendingPayments.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-zinc-500 mt-1">Awaiting customer clearance</p>
            </div>

            {/* 6. Total Refunds */}
            <div className="p-5 rounded-2xl bg-[#0D0819] border border-rose-500/20 hover:border-rose-500/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Total Refunds</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-rose-400 tracking-tight">₹{kpiMetrics.totalRefunds.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-zinc-500 mt-1">Refunded to original source</p>
            </div>
          </div>

          {/* Accounting Ledger Summary Bar */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#140C26] via-[#10081E] to-[#0D0719] border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">
                <CreditCard className="w-4 h-4 text-purple-400" />
                Ledger Accounting Balance Sheet ({dateRangeBounds.label})
              </div>
              <p className="text-xs text-zinc-400">
                Audited double-entry balance conforming to Indian accounting standard rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Opening Balance</span>
                <span className="font-semibold text-zinc-300">₹{accountingBalance.openingBalance.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-zinc-600 font-bold">+</span>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Period Sales</span>
                <span className="font-semibold text-emerald-400">₹{accountingBalance.periodGross.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-zinc-600 font-bold">-</span>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Period Refunds</span>
                <span className="font-semibold text-rose-400">₹{accountingBalance.periodRefunds.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-zinc-600 font-bold">=</span>
              <div className="pl-3 border-l border-white/10">
                <span className="text-purple-400 block text-[10px] uppercase font-bold">Closing Balance</span>
                <span className="text-base font-bold text-white">₹{accountingBalance.closingBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Quick Split: Product Revenue Summary & Recent Ledger Records */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Performance Mini Column */}
            <div className="p-6 rounded-2xl bg-[#0D0819] border border-purple-500/15 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Product Sales Share
                </h3>
                <button
                  onClick={() => setActiveSection('products')}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {productSalesMap.map(prod => {
                  const sharePct = kpiMetrics.totalSales > 0 ? Math.round((prod.totalRevenue / kpiMetrics.totalSales) * 100) : 0;
                  return (
                    <div
                      key={prod.edition}
                      onClick={() => { setDrilldownProduct(prod); }}
                      className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <img src={prod.image} alt={prod.name} className="w-8 h-5 object-cover rounded shadow" />
                          <div>
                            <div className="text-xs font-semibold text-white">{prod.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{prod.sku}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">₹{prod.totalRevenue.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-zinc-500">{prod.totalUnits} sold</div>
                        </div>
                      </div>
                      {/* Share Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                          style={{ width: `${sharePct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Sales Ledger Table Preview */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0D0819] border border-purple-500/15 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-400" />
                    Latest Sales Transactions
                  </h3>
                  <p className="text-xs text-zinc-500">Live order items recorded in database</p>
                </div>
                <button
                  onClick={() => setActiveSection('ledger')}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                >
                  Open Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Invoice</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ledgerRecords.slice(0, 6).map(order => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedTransactionOrder(order)}
                        className="hover:bg-purple-500/5 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-purple-300 whitespace-nowrap">
                          {order.invoiceId}
                        </td>
                        <td className="py-3 px-3 text-white font-medium">
                          {order.customerName}
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          <span className="capitalize">{order.edition}</span> NFC Card
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                          ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {renderPaymentBadge(order.paymentStatus)}
                        </td>
                      </tr>
                    ))}
                    {ledgerRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No sales transactions found in the selected date range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. SALES LEDGER PAGE */}
      {/* =================================================================== */}
      {activeSection === 'ledger' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Control Bar: Search, Filters, Sorters, Export Buttons */}
          <div className="p-5 rounded-2xl bg-[#0D0819] border border-purple-500/15 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice ID, order ID, customer, card serial, or SKU..."
                value={ledgerSearch}
                onChange={e => { setLedgerSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-[#120B22] border border-purple-500/20 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              {ledgerSearch && (
                <button onClick={() => setLedgerSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Payment Status Filter */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#120B22] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={methodFilter}
                onChange={e => { setMethodFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#120B22] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Payment Methods</option>
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="card">Card (Visa / Mastercard)</option>
                <option value="netbanking">Net Banking</option>
                <option value="cash">Cash / Offline</option>
              </select>

              {/* Product Edition Filter */}
              <select
                value={productFilter}
                onChange={e => { setProductFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#120B22] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Product Editions</option>
                <option value="gold">Gold Edition</option>
                <option value="platinum">Platinum Edition</option>
                <option value="purple">Purple Edition</option>
                <option value="metal">Metal Edition</option>
              </select>

              {/* Sort Toggle */}
              <button
                onClick={() => {
                  setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#120B22] border border-purple-500/20 rounded-xl text-xs text-zinc-300 hover:text-white"
                title="Toggle Sort Order"
              >
                <span>{sortField === 'date' ? 'Date' : 'Amount'}</span>
                {sortOrder === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-purple-400" /> : <ChevronUp className="w-3.5 h-3.5 text-purple-400" />}
              </button>

              {/* Export CSV Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-xl text-xs text-purple-300 font-medium transition-colors"
                title="Export as CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              {/* Export Excel Button */}
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium transition-colors"
                title="Export as Excel Workbook (.xls)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Opening & Closing Balance Accounting Strip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/20 via-[#10081E] to-purple-950/20 border border-purple-500/20 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 font-bold">LEDGER</span>
              <span className="text-zinc-300 font-medium">Accounting Period: <strong className="text-white">{dateRangeBounds.label}</strong></span>
              <span className="text-zinc-500">• Showing {ledgerRecords.length} sales entries</span>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase">Opening:</span>
                <span className="ml-1.5 font-semibold text-zinc-300">₹{accountingBalance.openingBalance.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase">Total Sales:</span>
                <span className="ml-1.5 font-semibold text-emerald-400">+₹{accountingBalance.periodGross.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase">Total Refunds:</span>
                <span className="ml-1.5 font-semibold text-rose-400">-₹{accountingBalance.periodRefunds.toLocaleString('en-IN')}</span>
              </div>
              <div className="pl-4 border-l border-white/10">
                <span className="text-purple-400 text-[10px] uppercase font-bold">Closing:</span>
                <span className="ml-1.5 font-bold text-white">₹{accountingBalance.closingBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Dedicated Full Accounting Ledger Table */}
          <div className="rounded-2xl bg-[#0D0819] border border-purple-500/15 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#140C26] text-zinc-300 font-semibold uppercase tracking-wider text-[10px] border-b border-purple-500/20">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Product Code / SKU</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Tax</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Payment Method</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedLedger.map(order => {
                    const item = order.items?.[0] || {};
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedTransactionOrder(order)}
                        className="hover:bg-purple-500/5 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-zinc-400">
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-purple-300">
                          {order.invoiceId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {order.orderReference || order.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{order.customerName}</div>
                          <div className="text-[10px] text-zinc-500">{order.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-zinc-200 font-medium">{item.productName || `${(order.edition || 'Purple').toUpperCase()} Edition NFC Card`}</div>
                          <div className="text-[10px] text-zinc-500">{item.variant || 'Standard'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                          {item.sku || order.cardCode || `FLC-SKU-${order.id.slice(-4)}`}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-white">
                          {order.quantity || 1}
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-300">
                          ₹{(Number(order.unitPrice || order.totalAmount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-400">
                          {Number(order.discount || 0) > 0 ? `-₹${Number(order.discount).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-400">
                          ₹{(Number(order.tax || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white">
                          ₹{(Number(order.totalAmount || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-zinc-300 uppercase">
                            {order.paymentMethod || 'UPI'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderPaymentBadge(order.paymentStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedTransactionOrder(order)}
                              className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                              title="View Transaction Breakdown & Auditing"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setInvoiceModalOrder(order)}
                              className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                              title="Print & Download Tax Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedLedger.length === 0 && (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-zinc-500">
                        No sales transactions match the given query or date filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#120B22] border-t border-purple-500/15 text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <span>Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, ledgerRecords.length)} of {ledgerRecords.length} records</span>
                <div className="flex items-center gap-1.5">
                  <span>Rows:</span>
                  <select
                    value={rowsPerPage}
                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-[#0C0717] border border-purple-500/20 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-purple-500/20 bg-[#0C0717] text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-500/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-xs font-semibold text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-purple-500/20 bg-[#0C0717] text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-500/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. PRODUCT-WISE SALES LEDGER */}
      {/* =================================================================== */}
      {activeSection === 'products' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              FLOCARD Hardware & Custom NFC Product Sales
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Product-level sales telemetry, unit volumes, discounts, net margins, and inventory status. Click any product card for its drilldown report.
            </p>
          </div>

          {/* Product Sales Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productSalesMap.map(prod => (
              <div
                key={prod.edition}
                onClick={() => setDrilldownProduct(prod)}
                className="rounded-2xl bg-[#0D0819] border border-purple-500/15 hover:border-purple-500/40 p-5 space-y-4 cursor-pointer transition-all hover:shadow-xl hover:shadow-purple-900/10 group"
              >
                {/* Product Card Image & Badge */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-black/40 border border-white/5">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-purple-300 border border-purple-500/30">
                    {prod.stock > 10 ? `${prod.stock} In Stock` : `${prod.stock} Low Stock`}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-white/10">
                    {prod.sku}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-zinc-400">{prod.variant}</p>
                  <p className="text-xs font-semibold text-purple-400 mt-1">₹{prod.price.toLocaleString('en-IN')} retail</p>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.02]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Units Sold</span>
                    <span className="font-bold text-white">{prod.totalUnits} cards</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Total Orders</span>
                    <span className="font-bold text-white">{prod.ordersCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Total Revenue</span>
                    <span className="font-bold text-emerald-400">₹{prod.totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Net Sales</span>
                    <span className="font-bold text-purple-300">₹{prod.netSales.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button className="w-full py-2 px-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 font-semibold text-xs border border-purple-500/20 flex items-center justify-center gap-1.5 transition-colors">
                  <span>View Product Sales Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. PHYSICAL CARD SALES TRACKING */}
      {/* =================================================================== */}
      {activeSection === 'cards' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" />
              Individual Physical NFC Card Tracking
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              End-to-end hardware lifecycle: manufacturing status, assigned digital identity URLs, NFC UID, delivery, and tap activation.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0D0819] border border-purple-500/15 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#140C26] text-zinc-300 font-semibold uppercase tracking-wider text-[10px] border-b border-purple-500/20">
                  <tr>
                    <th className="py-3 px-4">Card Serial / ID</th>
                    <th className="py-3 px-4">NFC UID Chipset</th>
                    <th className="py-3 px-4">Edition / Artwork</th>
                    <th className="py-3 px-4">Linked Customer & Order</th>
                    <th className="py-3 px-4 text-center">Production Status</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4">Digital Profile Routing</th>
                    <th className="py-3 px-4 text-center">Activation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map(order => {
                    const cardCode = order.cardCode || `FLC-${(order.edition || 'PUR').slice(0, 3).toUpperCase()}-${order.id.slice(-4)}`;
                    const nfcUid = order.nfcUid || '04:7B:A2:1F:90:3C:80';
                    const profileUrl = order.profileSlug ? `https://${order.profileSlug}.flocard.in` : null;

                    return (
                      <tr key={order.id} className="hover:bg-purple-500/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                          {cardCode}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                          {nfcUid}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize font-semibold text-white">{order.edition}</span> NFC Card
                          <span className="block text-[10px] text-zinc-500">{order.templateType || 'Standard'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{order.customerName}</div>
                          <div className="text-[10px] text-purple-400 font-mono">{order.orderReference || order.id}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-zinc-300 border border-white/10 capitalize">
                            {(order.status || 'processing').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderPaymentBadge(order.paymentStatus)}
                        </td>
                        <td className="py-3.5 px-4">
                          {profileUrl ? (
                            <a
                              href={profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-mono"
                            >
                              <span>{order.profileSlug}.flocard.in</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">Pending delivery</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {order.status === 'delivered' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active Tap
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        No physical card records in the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. SALES ANALYTICS (INTERACTIVE CHARTS) */}
      {/* =================================================================== */}
      {activeSection === 'analytics' && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Sales Performance & Visual Analytics ({dateRangeBounds.label})
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time revenue distributions, order trends, AOV analytics, and payment status ratios.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0D0819] border border-purple-500/15">
              <span className="text-[11px] text-zinc-400 uppercase block font-semibold">Average Order Value (AOV)</span>
              <span className="text-2xl font-bold text-white mt-1 block">₹{kpiMetrics.aov.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-zinc-500">Gross revenue per transaction</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0819] border border-purple-500/15">
              <span className="text-[11px] text-zinc-400 uppercase block font-semibold">Net Collection Ratio</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                {kpiMetrics.totalSales > 0 ? Math.round((kpiMetrics.netSales / kpiMetrics.totalSales) * 100) : 100}%
              </span>
              <span className="text-[11px] text-zinc-500">Retained revenue after refunds</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0819] border border-purple-500/15">
              <span className="text-[11px] text-zinc-400 uppercase block font-semibold">Discount Rate</span>
              <span className="text-2xl font-bold text-purple-300 mt-1 block">
                {kpiMetrics.totalSales > 0 ? ((kpiMetrics.totalDiscounts / kpiMetrics.totalSales) * 100).toFixed(1) : 0}%
              </span>
              <span className="text-[11px] text-zinc-500">Discounts vs total gross sales</span>
            </div>
          </div>

          {/* Interactive Responsive SVG Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Product Revenue Share Bar Chart */}
            <div className="p-6 rounded-2xl bg-[#0D0819] border border-purple-500/15 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Product-wise Revenue Comparison
              </h3>
              <div className="space-y-4 pt-2">
                {productSalesMap.map(prod => {
                  const maxRev = Math.max(...productSalesMap.map(p => p.totalRevenue), 1);
                  const pct = Math.round((prod.totalRevenue / maxRev) * 100);
                  return (
                    <div key={prod.edition} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{prod.name}</span>
                        <span className="font-mono font-bold text-purple-300">₹{prod.totalRevenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>{prod.totalUnits} cards sold</span>
                        <span>{prod.ordersCount} orders</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Payment Status Breakdown */}
            <div className="p-6 rounded-2xl bg-[#0D0819] border border-purple-500/15 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                Payment Clearance Distribution
              </h3>

              {(() => {
                const paidCount = filteredOrders.filter(o => o.paymentStatus === 'paid').length;
                const partCount = filteredOrders.filter(o => o.paymentStatus === 'partially_paid').length;
                const pendCount = filteredOrders.filter(o => o.paymentStatus === 'pending').length;
                const refCount = filteredOrders.filter(o => o.paymentStatus === 'refunded').length;
                const total = filteredOrders.length || 1;

                const segments = [
                  { label: 'Fully Paid', count: paidCount, color: 'bg-emerald-500', text: 'text-emerald-400' },
                  { label: 'Partially Paid', count: partCount, color: 'bg-amber-500', text: 'text-amber-400' },
                  { label: 'Pending Payment', count: pendCount, color: 'bg-purple-500', text: 'text-purple-400' },
                  { label: 'Refunded', count: refCount, color: 'bg-rose-500', text: 'text-rose-400' }
                ];

                return (
                  <div className="space-y-4 pt-2">
                    {/* Multi-segment Progress Bar */}
                    <div className="w-full h-4 rounded-full bg-white/5 flex overflow-hidden">
                      {segments.map(s => {
                        const widthPct = (s.count / total) * 100;
                        if (widthPct === 0) return null;
                        return (
                          <div
                            key={s.label}
                            className={`h-full ${s.color} transition-all duration-700`}
                            style={{ width: `${widthPct}%` }}
                            title={`${s.label}: ${s.count} (${widthPct.toFixed(1)}%)`}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      {segments.map(s => (
                        <div key={s.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                            <span className="text-zinc-400">{s.label}</span>
                          </div>
                          <div className={`text-base font-bold mt-1 ${s.text}`}>
                            {s.count} <span className="text-xs text-zinc-500">({Math.round((s.count / total) * 100)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. INVOICE SETTINGS */}
      {/* =================================================================== */}
      {activeSection === 'settings' && (
        <div className="max-w-4xl space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              Tax Invoice & Business Entity Configuration
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              These details appear on all generated client tax invoices, customer print slips, and vector PDF exports.
            </p>
          </div>

          {invSettingsSaved && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Invoice settings saved successfully and updated live across all invoices.</span>
            </div>
          )}

          <form onSubmit={handleSaveInvoiceSettings} className="p-6 rounded-2xl bg-[#0D0819] border border-purple-500/15 space-y-6">
            {/* Business Identity */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Legal Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Registered Company Name</label>
                  <input
                    type="text"
                    value={invSettingsForm.companyName || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, companyName: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Brand / Trade Name</label>
                  <input
                    type="text"
                    value={invSettingsForm.tradeName || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, tradeName: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">GSTIN (Tax Registration)</label>
                  <input
                    type="text"
                    value={invSettingsForm.gstin || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, gstin: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    value={invSettingsForm.pan || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, pan: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Address & Contacts */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Registered Office & Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={invSettingsForm.addressLine1 || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, addressLine1: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">City, State & Postal Code</label>
                  <input
                    type="text"
                    value={invSettingsForm.cityStatePin || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, cityStatePin: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Billing Support Email</label>
                  <input
                    type="email"
                    value={invSettingsForm.supportEmail || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, supportEmail: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={invSettingsForm.supportPhone || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, supportPhone: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Remittance & Bank Info */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Bank Remittance & UPI Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={invSettingsForm.bankName || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, bankName: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={invSettingsForm.accountNumber || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, accountNumber: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={invSettingsForm.ifsc || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, ifsc: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Official UPI ID</label>
                  <input
                    type="text"
                    value={invSettingsForm.upiId || ''}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, upiId: e.target.value })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Standard Tax Rate (%)</label>
                  <input
                    type="number"
                    value={invSettingsForm.taxRatePercent || 18}
                    onChange={e => setInvSettingsForm({ ...invSettingsForm, taxRatePercent: Number(e.target.value) })}
                    className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Notes */}
            <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
              <label className="text-zinc-400 block">Default Invoice Terms & Warranty Declarations</label>
              <textarea
                rows={4}
                value={invSettingsForm.notesTerms || ''}
                onChange={e => setInvSettingsForm({ ...invSettingsForm, notesTerms: e.target.value })}
                className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl p-3.5 text-white font-sans text-xs focus:outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30 transition-all"
              >
                Save Invoice Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* PRODUCT DRILLDOWN REPORT MODAL */}
      {/* =================================================================== */}
      {drilldownProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8 bg-[#0D0819] border border-purple-500/25 rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="flex items-center justify-between px-6 py-4 bg-[#140C26] border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <img src={drilldownProduct.image} alt="" className="w-10 h-6 object-cover rounded shadow" />
                <div>
                  <h3 className="text-sm font-bold text-white">{drilldownProduct.name}</h3>
                  <p className="text-[11px] text-purple-300 font-mono">{drilldownProduct.sku} • {drilldownProduct.variant}</p>
                </div>
              </div>
              <button
                onClick={() => setDrilldownProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Product KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block">Total Units</span>
                  <span className="text-lg font-bold text-white">{drilldownProduct.totalUnits} cards</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block">Total Orders</span>
                  <span className="text-lg font-bold text-white">{drilldownProduct.ordersCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block">Gross Sales</span>
                  <span className="text-lg font-bold text-emerald-400">₹{drilldownProduct.totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block">Net Sales</span>
                  <span className="text-lg font-bold text-purple-300">₹{drilldownProduct.netSales.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Orders containing this product */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Transactions Containing This Product ({drilldownProduct.orders.length})
                </h4>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#140C26] text-[10px] font-semibold text-zinc-400 uppercase border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Invoice</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-right">Discount</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {drilldownProduct.orders.map(order => (
                        <tr
                          key={order.id}
                          onClick={() => {
                            setDrilldownProduct(null);
                            setSelectedTransactionOrder(order);
                          }}
                          className="hover:bg-purple-500/5 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 text-zinc-400">
                            {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-purple-300">{order.invoiceId}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{order.customerName}</td>
                          <td className="py-2.5 px-3 text-center text-white">{order.quantity || 1}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-300">₹{(order.unitPrice || drilldownProduct.price).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-rose-400">
                            {Number(order.discount || 0) > 0 ? `-₹${Number(order.discount).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-center">{renderPaymentBadge(order.paymentStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. SALES TRANSACTION DETAILS MODAL */}
      {/* =================================================================== */}
      {selectedTransactionOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 bg-[#0D0819] border border-purple-500/25 rounded-2xl shadow-2xl overflow-hidden text-white">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#140C26] border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Transaction & Ledger Details</h3>
                  <p className="text-[11px] text-purple-300/70 font-mono">
                    {selectedTransactionOrder.invoiceId} • {selectedTransactionOrder.orderReference || selectedTransactionOrder.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceModalOrder(selectedTransactionOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedTransactionOrder(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Order & Customer Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold mb-1">Customer Details</span>
                  <div className="text-sm font-bold text-white">{selectedTransactionOrder.customerName}</div>
                  <div className="text-zinc-400">{selectedTransactionOrder.customerEmail}</div>
                  <div className="text-zinc-400">{selectedTransactionOrder.customerPhone}</div>
                  {selectedTransactionOrder.company && (
                    <div className="text-purple-300 font-medium mt-1">{selectedTransactionOrder.company}</div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold mb-1">Order Status & Specs</span>
                  <div className="flex items-center gap-2 mb-1.5">
                    {renderPaymentBadge(selectedTransactionOrder.paymentStatus)}
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-zinc-300 capitalize">
                      {(selectedTransactionOrder.status || 'processing').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-zinc-400">
                    <strong>Date:</strong> {new Date(selectedTransactionOrder.orderDate || selectedTransactionOrder.createdAt).toLocaleString('en-IN')}
                  </div>
                  <div className="text-zinc-400">
                    <strong>Payment Method:</strong> {(selectedTransactionOrder.paymentMethod || 'UPI').toUpperCase()}
                  </div>
                  {selectedTransactionOrder.transactionReference && (
                    <div className="text-zinc-400 font-mono">
                      <strong>Ref:</strong> {selectedTransactionOrder.transactionReference}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Item Cards */}
              <div className="space-y-2">
                <span className="text-[11px] text-zinc-400 uppercase font-semibold block">Order Items</span>
                {(selectedTransactionOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <img src={item.image || '/assets/cardbg-purple.png'} alt="" className="w-12 h-7 object-cover rounded shadow" />
                      <div>
                        <div className="text-xs font-bold text-white">{item.productName || 'FLOCARD NFC Card'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{item.sku || 'FLC-CARD-01'} • {item.variant || 'Standard'}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-zinc-400">{item.quantity || 1} × ₹{(Number(item.unitPrice) || 0).toLocaleString('en-IN')}</div>
                      <div className="font-bold text-white">₹{(Number(item.total || item.unitPrice) || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Balance Summary */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Unit Subtotal:</span>
                  <span className="text-white">₹{Number(selectedTransactionOrder.unitPrice * (selectedTransactionOrder.quantity || 1) || selectedTransactionOrder.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                {Number(selectedTransactionOrder.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount:</span>
                    <span>-₹{Number(selectedTransactionOrder.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {Number(selectedTransactionOrder.tax || 0) > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>GST (18%):</span>
                    <span className="text-white">₹{Number(selectedTransactionOrder.tax).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                  <span>Grand Total:</span>
                  <span className="text-purple-400">₹{Number(selectedTransactionOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Amount Paid:</span>
                  <span>₹{Number(selectedTransactionOrder.amountPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                {Number(selectedTransactionOrder.amountOutstanding || 0) > 0 && (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>Amount Outstanding:</span>
                    <span>₹{Number(selectedTransactionOrder.amountOutstanding).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {Number(selectedTransactionOrder.refundAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-400 font-semibold">
                    <span>Refunded Amount:</span>
                    <span>₹{Number(selectedTransactionOrder.refundAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Authorized Admin Financial Actions Bar */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <span className="text-[11px] text-zinc-400 uppercase font-semibold block">Authorized Financial Operations</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setPaymentForm({
                        amount: selectedTransactionOrder.amountOutstanding || '',
                        method: 'upi',
                        reference: '',
                        note: ''
                      });
                      setPaymentModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>

                  <button
                    onClick={() => {
                      setRefundForm({
                        amount: Math.max(0, (selectedTransactionOrder.amountPaid || 0) - (selectedTransactionOrder.refundAmount || 0)),
                        reason: ''
                      });
                      setRefundModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Issue Refund</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdjustmentForm({ type: 'discount', amount: '', reason: '' });
                      setAdjustmentModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Financial Adjustment</span>
                  </button>
                </div>
              </div>

              {/* Payment & Adjustment Audit Trail */}
              {selectedTransactionOrder.paymentTransactions && selectedTransactionOrder.paymentTransactions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] text-zinc-400 uppercase font-semibold block">Financial Audit History</span>
                  <div className="space-y-2">
                    {selectedTransactionOrder.paymentTransactions.map((txn, i) => (
                      <div key={txn.id || i} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-xs flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              txn.type === 'refund' ? 'bg-rose-500/20 text-rose-300' :
                              (txn.type === 'payment' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300')
                            }`}>
                              {txn.type}
                            </span>
                            <span className="font-bold text-white">₹{Number(txn.amount || 0).toLocaleString('en-IN')}</span>
                            {txn.method && <span className="text-zinc-500 uppercase font-mono">({txn.method})</span>}
                          </div>
                          {txn.note && <p className="text-zinc-400 mt-1">{txn.note}</p>}
                          {txn.reason && <p className="text-rose-300/80 mt-1">Reason: {txn.reason}</p>}
                        </div>
                        <div className="text-right text-[10px] text-zinc-500">
                          <div>{new Date(txn.date || Date.now()).toLocaleDateString('en-IN')}</div>
                          <div>By: {txn.recordedBy || 'Admin'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* RECORD PAYMENT SUB-MODAL */}
      {/* =================================================================== */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0D0819] border border-emerald-500/30 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Record Offline / Partial Payment
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Payment Amount (INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1999"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="cash">Cash / Physical Clearance</option>
                  <option value="cheque">Bank Cheque / DD</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Transaction Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/20261020/987162"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Internal Note / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Optional internal notes on payment verification..."
                  value={paymentForm.note}
                  onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* RECORD REFUND SUB-MODAL */}
      {/* =================================================================== */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0D0819] border border-rose-500/30 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                Process Financial Refund
              </h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordRefund} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Refund Amount (INR) *</label>
                <input
                  type="number"
                  required
                  value={refundForm.amount}
                  onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Mandatory Audit Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify reason for refund (e.g. Card replacement rejected, Customer requested cancellation prior to print, etc.)..."
                  value={refundForm.reason}
                  onChange={e => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl"
                >
                  Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FINANCIAL ADJUSTMENT SUB-MODAL */}
      {/* =================================================================== */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0D0819] border border-purple-500/30 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
                Apply Financial Adjustment
              </h3>
              <button onClick={() => setAdjustmentModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Adjustment Type</label>
                <select
                  value={adjustmentForm.type}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="discount">Discount Adjustment (+/-)</option>
                  <option value="tax">Tax Calculation Correction</option>
                  <option value="shipping">Shipping Fee Correction</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Adjustment Amount (INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 200"
                  value={adjustmentForm.amount}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Mandatory Audit Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why this financial adjustment is being made..."
                  value={adjustmentForm.reason}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full bg-[#120B22] border border-purple-500/20 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAX INVOICE PRINT & PDF MODAL */}
      {/* =================================================================== */}
      {invoiceModalOrder && (
        <InvoiceModal
          order={invoiceModalOrder}
          onClose={() => setInvoiceModalOrder(null)}
        />
      )}
    </div>
  );
}

// Icon helper
function LayoutDashboardIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect width="7" height="9" x="3" y="3" rx="1" strokeWidth="2" />
      <rect width="7" height="5" x="14" y="3" rx="1" strokeWidth="2" />
      <rect width="7" height="9" x="14" y="12" rx="1" strokeWidth="2" />
      <rect width="7" height="5" x="3" y="16" rx="1" strokeWidth="2" />
    </svg>
  );
}
