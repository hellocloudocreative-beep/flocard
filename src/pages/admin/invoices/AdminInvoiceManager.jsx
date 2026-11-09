/* ==========================================================================
   FLOCARDS ADMIN INVOICE MANAGEMENT & ACCESS GOVERNANCE SYSTEM
   Allows owners and administrators to manually select active registered
   customers, assign or decline tax invoice generator access, configure
   official invoicing rules, and track tax ledgers.
   Strictly excludes deleted customers and zombie mock orders.
   ========================================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Settings,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Send,
  MessageCircle,
  Building2,
  FileSpreadsheet,
  Check,
  X,
  CreditCard,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Sliders,
  AlertTriangle,
  UserCheck,
  UserX,
  PlusCircle,
  User,
  Trash2,
  Plus,
  RotateCcw,
  Edit3
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { calculateOrderPricing, getInvoiceConfig, saveInvoiceConfig, DEFAULT_BUSINESS_DETAILS } from '../../../lib/orderPricing';
import { downloadInvoicePDF, INVOICE_THEMES } from '../../../lib/invoicePdfExport';
import { formatCurrencyINR, StorageEngine } from '../../../lib/storage';
import ReceiptPrintAnimation from '../../../components/common/ReceiptPrintAnimation';

export default function AdminInvoiceManager({ initialOrderId = null }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const {
    orders = [],
    customers = [],
    assignOrderInvoice,
    declineOrderInvoice,
    assignCustomerInvoice,
    declineCustomerInvoice,
    getInvoices,
    deleteInvoice,
    refreshAll
  } = useData();

  // Active view tab: 'access' (order permissions) | 'ledger' (generated invoices) | 'settings' (pricing & entity)
  const [activeTab, setActiveTab] = useState('access');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'assigned' | 'declined' | 'not_requested'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'paid' | 'pending'

  // Manual Assignment Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('all');
  const [modalActionType, setModalActionType] = useState('assign'); // 'assign' | 'decline'
  const [modalReason, setModalReason] = useState('Payment verified & approved for tax invoice generator access');
  const [modalLoading, setModalLoading] = useState(false);

  // Single Row Confirmation State (when clicking Assign/Decline directly on a row)
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);

  // Preview Modal
  const [previewOrder, setPreviewOrder] = useState(null);
  const [previewActiveTab, setPreviewActiveTab] = useState('preview'); // 'preview' | 'details' | 'items'
  const [previewThemeId, setPreviewThemeId] = useState('midnight_purple');
  const [isExporting, setIsExporting] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [adminCustomDetails, setAdminCustomDetails] = useState({
    customerName: '',
    company: '',
    phone: '',
    email: '',
    shippingAddress: '',
    gstin: ''
  });
  const [adminCustomItems, setAdminCustomItems] = useState([]);

  // Settings State
  const [invoiceConfig, setInvoiceConfigState] = useState(getInvoiceConfig());
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync config updates
  useEffect(() => {
    setInvoiceConfigState(getInvoiceConfig());
  }, []);

  // Preset if initialOrderId is passed
  useEffect(() => {
    if (initialOrderId) {
      setSearchQuery(initialOrderId);
    }
  }, [initialOrderId]);

  // Read generated invoices
  const generatedInvoices = useMemo(() => {
    if (typeof getInvoices === 'function') {
      return getInvoices();
    }
    return StorageEngine.getInvoices ? StorageEngine.getInvoices() : [];
  }, [getInvoices, orders]);

  // =========================================================================
  // STRICT FILTERING: EXCLUDE DELETED CUSTOMERS & ORPHANED ORDERS
  // =========================================================================
  const activeCustomers = useMemo(() => {
    // Only return registered, non-deleted customers
    return customers.filter(c => !c.deleted && !c.is_deleted);
  }, [customers]);

  const activeCustomerLookup = useMemo(() => {
    const map = new Map();
    activeCustomers.forEach(c => {
      if (c.id) map.set(c.id.toLowerCase().trim(), c);
      if (c.email) map.set(c.email.toLowerCase().trim(), c);
    });
    return map;
  }, [activeCustomers]);

  // Filter orders so ONLY orders from currently active, non-deleted customers are shown
  const activeOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.deleted || order.is_deleted) return false;

      // If active customers exist, strictly ensure order belongs to an active customer
      if (activeCustomers.length > 0) {
        const email = (order.customerDetails?.email || order.customerEmail || '').toLowerCase().trim();
        const custId = (order.customerId || order.customer_id || '').toLowerCase().trim();
        const hasMatchingCustomer = (custId && activeCustomerLookup.has(custId)) || (email && activeCustomerLookup.has(email));
        if (!hasMatchingCustomer) return false;
      }
      return true;
    });
  }, [orders, activeCustomers, activeCustomerLookup]);

  // Calculate Metrics from strictly active orders
  const metrics = useMemo(() => {
    let totalAssigned = 0;
    let totalDeclined = 0;
    let totalPending = 0;
    let totalAddonRevenue = 0;

    activeOrders.forEach(order => {
      const isEligible = Boolean(order.invoiceEligible || order.invoice_eligible);
      const isDeclined = order.invoiceStatus === 'declined';
      const hasAddon = Boolean(order.hasInvoiceAddon || order.has_invoice_addon);

      if (isEligible) {
        totalAssigned += 1;
      } else if (isDeclined) {
        totalDeclined += 1;
      } else if (hasAddon) {
        totalPending += 1;
      }

      if (hasAddon && order.paymentStatus === 'paid') {
        const addonAmt = order.pricingBreakdown?.invoiceAddonFee || 199;
        totalAddonRevenue += addonAmt;
      }
    });

    const totalInvoiceValue = generatedInvoices.reduce((sum, inv) => {
      return sum + (Number(inv.total) || 0);
    }, 0);

    return {
      totalInvoices: generatedInvoices.length,
      totalInvoiceValue,
      totalAddonRevenue,
      totalAssigned,
      totalPending,
      totalDeclined,
      totalOrders: activeOrders.length,
      totalActiveCustomers: activeCustomers.length
    };
  }, [activeOrders, activeCustomers, generatedInvoices]);

  // Filter Active Orders for Display
  const filteredOrders = useMemo(() => {
    return activeOrders.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      const ref = (order.orderReference || order.id || '').toLowerCase();
      const name = (order.customerDetails?.fullName || order.customerName || '').toLowerCase();
      const email = (order.customerDetails?.email || order.customerEmail || '').toLowerCase();
      const phone = (order.customerDetails?.phone || order.customerPhone || '').toLowerCase();
      const invNum = (order.invoiceNumber || '').toLowerCase();

      const matchesQuery = !q || ref.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q) || invNum.includes(q);
      if (!matchesQuery) return false;

      // Status filter
      const isEligible = Boolean(order.invoiceEligible || order.invoice_eligible);
      const isDeclined = order.invoiceStatus === 'declined';
      const hasAddon = Boolean(order.hasInvoiceAddon || order.has_invoice_addon);

      if (statusFilter === 'assigned' && !isEligible) return false;
      if (statusFilter === 'declined' && !isDeclined) return false;
      if (statusFilter === 'pending' && (!hasAddon || isEligible || isDeclined)) return false;
      if (statusFilter === 'not_requested' && hasAddon) return false;

      // Payment filter
      if (paymentFilter === 'paid' && order.paymentStatus !== 'paid') return false;
      if (paymentFilter === 'pending' && order.paymentStatus === 'paid') return false;

      return true;
    });
  }, [activeOrders, searchQuery, statusFilter, paymentFilter]);

  // Orders belonging to currently selected customer in modal
  const customerOrdersForModal = useMemo(() => {
    if (!selectedCustomerId) return [];
    const cust = activeCustomers.find(c => c.id === selectedCustomerId || c.email === selectedCustomerId);
    if (!cust) return [];

    return activeOrders.filter(order => {
      const orderEmail = (order.customerDetails?.email || order.customerEmail || '').toLowerCase().trim();
      const orderCustId = (order.customerId || order.customer_id || '').toLowerCase().trim();
      return orderCustId === cust.id.toLowerCase() || (cust.email && orderEmail === cust.email.toLowerCase().trim());
    });
  }, [selectedCustomerId, activeCustomers, activeOrders]);

  // Filter Generated Invoices for Ledger
  const filteredInvoices = useMemo(() => {
    return generatedInvoices.filter(inv => {
      const q = searchQuery.toLowerCase().trim();
      const num = (inv.invoiceNumber || '').toLowerCase();
      const ref = (inv.orderReference || '').toLowerCase();
      const cust = (inv.customerName || inv.billedTo?.name || '').toLowerCase();
      const email = (inv.billedTo?.email || '').toLowerCase();

      return !q || num.includes(q) || ref.includes(q) || cust.includes(q) || email.includes(q);
    });
  }, [generatedInvoices, searchQuery]);

  // Open manual assignment modal for a specific customer or fresh
  const handleOpenManualModal = (preCustomer = null, preOrder = null, action = 'assign') => {
    if (preCustomer) {
      setSelectedCustomerId(preCustomer.id || preCustomer.email || '');
    } else if (activeCustomers.length > 0) {
      setSelectedCustomerId(activeCustomers[0].id || activeCustomers[0].email || '');
    } else {
      setSelectedCustomerId('');
    }

    if (preOrder) {
      setSelectedOrderId(preOrder.id || preOrder.orderReference || 'all');
    } else {
      setSelectedOrderId('all');
    }

    setModalActionType(action);
    setModalReason(
      action === 'assign'
        ? 'Payment verified & approved for tax invoice generator access'
        : 'Invoice add-on fee unpaid or details unverified'
    );
    setShowManualModal(true);
  };

  // Submit Manual Assignment
  const handleManualAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId && activeCustomers.length > 0) {
      showToast('Please select an active customer', 'error');
      return;
    }

    setModalLoading(true);
    try {
      const reason = modalReason.trim() || (modalActionType === 'assign' ? 'Approved by administrator' : 'Declined by administrator');
      const targetCustomer = activeCustomers.find(c => c.id === selectedCustomerId || c.email === selectedCustomerId);

      if (selectedOrderId && selectedOrderId !== 'all') {
        // Specific order selected
        if (modalActionType === 'assign') {
          if (assignOrderInvoice) {
            assignOrderInvoice(selectedOrderId, user, reason);
          } else {
            StorageEngine.assignOrderInvoice(selectedOrderId, user, reason);
          }
          showToast(`Invoice generator access ASSIGNED for order ${selectedOrderId}`);
        } else {
          if (declineOrderInvoice) {
            declineOrderInvoice(selectedOrderId, user, reason);
          } else {
            StorageEngine.declineOrderInvoice(selectedOrderId, user, reason);
          }
          showToast(`Invoice generator access DECLINED for order ${selectedOrderId}`, 'error');
        }
      } else {
        // Customer / Account-level grant (all orders)
        const custId = targetCustomer?.id || selectedCustomerId;
        if (modalActionType === 'assign') {
          if (assignCustomerInvoice) {
            assignCustomerInvoice(custId, user, reason);
          } else {
            StorageEngine.assignCustomerInvoice(custId, user, reason);
          }
          showToast(`Invoice generator access ASSIGNED to customer ${targetCustomer?.name || custId}`);
        } else {
          if (declineCustomerInvoice) {
            declineCustomerInvoice(custId, user, reason);
          } else {
            StorageEngine.declineCustomerInvoice(custId, user, reason);
          }
          showToast(`Invoice generator access DECLINED for customer ${targetCustomer?.name || custId}`, 'error');
        }
      }

      refreshAll?.();
      setShowManualModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to update invoice assignment', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    try {
      const saved = saveInvoiceConfig(invoiceConfig);
      setInvoiceConfigState(saved);
      setSettingsSuccess(true);
      showToast('Invoice system settings and business details updated successfully');
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'error');
    }
  };

  // Dynamic custom totals calculation for admin preview & export
  const adminTotals = useMemo(() => {
    const taxableBase = (adminCustomItems || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const cgstRate = 0.09;
    const sgstRate = 0.09;
    const cgstAmount = Math.round(taxableBase * cgstRate * 100) / 100;
    const sgstAmount = Math.round(taxableBase * sgstRate * 100) / 100;
    const totalAmount = Math.round((taxableBase + cgstAmount + sgstAmount) * 100) / 100;
    return {
      taxableBase,
      cgstRate: 9,
      sgstRate: 9,
      cgstAmount,
      sgstAmount,
      totalTax: Math.round((cgstAmount + sgstAmount) * 100) / 100,
      totalAmount
    };
  }, [adminCustomItems]);

  // Open Preview Modal with custom details & line items initialized (supports creating blank invoice)
  const openOrderPreview = (order) => {
    const targetOrder = order || {
      id: `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      orderReference: `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Flocard Customer',
      customerPhone: '+91 97782 78552',
      customerEmail: 'customer@flocard.com',
      shippingAddress: 'Indiranagar, Bengaluru, Karnataka 560038',
      city: 'Indiranagar, Bengaluru',
      edition: 'purple',
      quantity: 1,
      paymentStatus: 'paid'
    };
    setPreviewOrder(targetOrder);
    setPreviewActiveTab('preview');
    const resolvedName = targetOrder.customerName || targetOrder.design?.front?.name || targetOrder.frontConfig?.name || targetOrder.customerDetails?.fullName || 'Customer Name';
    const resolvedCompany = targetOrder.company || targetOrder.design?.front?.company || targetOrder.frontConfig?.company || targetOrder.customerDetails?.company || '';
    setAdminCustomDetails({
      customerName: resolvedName,
      place: targetOrder.customerDetails?.city || targetOrder.city || 'Indiranagar, Bengaluru',
      company: resolvedCompany,
      phone: targetOrder.customerPhone || targetOrder.customerDetails?.phone || '',
      email: targetOrder.customerEmail || targetOrder.customerDetails?.email || '',
      shippingAddress: targetOrder.customerDetails?.address
        ? `${targetOrder.customerDetails.address}, ${targetOrder.customerDetails.city || ''} ${targetOrder.customerDetails.postalCode || ''}`.trim()
        : (targetOrder.shippingAddress || 'Indiranagar, Bengaluru'),
      gstin: targetOrder.customerDetails?.gstin || ''
    });

    const baseUnitPrice = targetOrder.pricingBreakdown?.unitPrice || 1999;
    const baseQty = targetOrder.quantity || 1;
    const initialItems = [
      {
        id: 'admin-item-1',
        title: `FLOCARD Smart NFC Card (${targetOrder.edition ? targetOrder.edition.charAt(0).toUpperCase() + targetOrder.edition.slice(1) : 'Purple'} Edition) - ${resolvedName}`,
        subtitle: `Custom personalized NFC card for ${resolvedName}`,
        hsn: '852352',
        qty: baseQty,
        rate: baseUnitPrice,
        amount: Math.round(baseUnitPrice * baseQty * 100) / 100
      }
    ];

    if (targetOrder.pricingBreakdown?.invoiceAddonFee > 0) {
      initialItems.push({
        id: 'admin-item-addon',
        title: 'Official Tax Invoice Add-on & Ledger Entitlement',
        subtitle: 'GST compliance ledger & accounting export certificate',
        hsn: '998313',
        qty: 1,
        rate: targetOrder.pricingBreakdown.invoiceAddonFee,
        amount: targetOrder.pricingBreakdown.invoiceAddonFee
      });
    }

    setAdminCustomItems(initialItems);
  };

  // Custom Line Item Handlers for Admin (supports smooth backspacing and edits)
  const handleAdminUpdateItem = (id, field, value) => {
    setAdminCustomItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'qty' || field === 'rate') {
        const q = field === 'qty' ? (value === '' ? '' : (parseFloat(value) || 0)) : (item.qty === '' ? 1 : (parseFloat(item.qty) || 0));
        const r = field === 'rate' ? (value === '' ? '' : (parseFloat(value) || 0)) : (item.rate === '' ? 0 : (parseFloat(item.rate) || 0));
        updated.amount = Math.round((Number(q) || 0) * (Number(r) || 0) * 100) / 100;
      }
      return updated;
    }));
  };

  const handleAdminAddItem = () => {
    const newItem = {
      id: `admin-item-${Date.now()}`,
      title: 'Custom Product / Service',
      subtitle: 'Official corporate customized service description',
      hsn: '852352',
      qty: 1,
      rate: 999,
      amount: 999
    };
    setAdminCustomItems(prev => [...prev, newItem]);
  };

  const handleAdminRemoveItem = (id) => {
    if (adminCustomItems.length <= 1) {
      showToast('At least one line item is required on the tax invoice', 'error');
      return;
    }
    setAdminCustomItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAdminResetItems = () => {
    if (!previewOrder) return;
    const baseUnitPrice = previewOrder.pricingBreakdown?.unitPrice || 1999;
    const baseQty = previewOrder.quantity || 1;
    const resetItems = [
      {
        id: 'admin-item-1',
        title: `FLOCARD Smart NFC Card (${previewOrder.edition ? previewOrder.edition.charAt(0).toUpperCase() + previewOrder.edition.slice(1) : 'Purple'} Edition)`,
        subtitle: 'Premium contactless business card embedded with NXP NTAG216 chip',
        hsn: '852352',
        qty: baseQty,
        rate: baseUnitPrice,
        amount: Math.round(baseUnitPrice * baseQty * 100) / 100
      }
    ];
    if (previewOrder.pricingBreakdown?.invoiceAddonFee > 0) {
      resetItems.push({
        id: 'admin-item-addon',
        title: 'Official Tax Invoice Add-on & Ledger Entitlement',
        subtitle: 'GST compliance ledger & accounting export certificate',
        hsn: '998313',
        qty: 1,
        rate: previewOrder.pricingBreakdown.invoiceAddonFee,
        amount: previewOrder.pricingBreakdown.invoiceAddonFee
      });
    }
    setAdminCustomItems(resetItems);
    showToast('Line items reset to order default values');
  };

  // Trigger PDF Download for an order with custom client details & custom item names
  const handleDownloadOrderPDF = async (order) => {
    setIsExporting(true);
    try {
      const pricing = order.pricingBreakdown || calculateOrderPricing({
        edition: order.edition || 'purple',
        quantity: order.quantity || 1,
        hasInvoiceAddon: true
      });
      const invoiceNumber = order.invoiceNumber || `INV-${new Date().getFullYear()}-${String(order.id || '0001').slice(-4).toUpperCase()}`;

      setPrintReceiptData({
        invoiceNumber,
        customerName: adminCustomDetails.customerName || order.customerName || 'Valued Client',
        totalAmount: `₹${Number(adminTotals.totalAmount || pricing.totalAmount || 0).toLocaleString('en-IN')}`,
        items: adminCustomItems.length > 0 ? adminCustomItems.map(it => ({ title: it.title, amount: it.amount || (it.qty * it.rate) })) : [{ title: `${order.edition || 'Custom'} NFC Card`, amount: pricing.totalAmount }]
      });

      await downloadInvoicePDF({
        invoiceNumber,
        order,
        pricing,
        themeId: previewThemeId,
        businessDetails: invoiceConfig.business || DEFAULT_BUSINESS_DETAILS,
        customDetails: adminCustomDetails,
        customItems: adminCustomItems,
        customTotals: adminTotals
      });
      showToast(`Tax invoice PDF ${invoiceNumber} downloaded successfully!`);
    } catch (err) {
      console.error('Invoice PDF download error:', err);
      showToast('Failed to download invoice PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteInvoice = (inv) => {
    const num = inv.invoiceNumber || inv.id;
    if (window.confirm(`Are you sure you want to permanently delete Invoice ${num}?`)) {
      deleteInvoice(inv.id || num);
      showToast(`Invoice ${num} permanently deleted.`);
    }
  };

  // Theme Colors
  const bgCard = isDark ? '#161022' : '#FFFFFF';
  const borderCard = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  const textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  const textMuted = isDark ? '#9B90AD' : '#64748B';

  return (
    <div className="admin-invoice-manager" style={{ padding: '0 0 40px 0' }}>
      {/* Toast Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: '#FFFFFF',
          fontSize: '0.88rem',
          fontWeight: 600,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Top Banner Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6B00FF 0%, #A855F7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(107, 0, 255, 0.3)'
            }}>
              <Receipt size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Tax Invoice Management & Access Governance
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: textMuted }}>
                Manually select active customers, assign or decline tax invoice generator entitlements, and track GST revenue.
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Create Custom Invoice Button */}
          <button
            onClick={() => openOrderPreview(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #6B00FF 0%, #5500CC 100%)',
              color: '#FFFFFF',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(107, 0, 255, 0.3)'
            }}
          >
            <Plus size={16} />
            + Create Invoice
          </button>

          {/* Prominent Manual Assign Button */}
          <button
            onClick={() => handleOpenManualModal(null, null, 'assign')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <UserCheck size={16} />
            Assign Invoice Access
          </button>

          <button
            onClick={() => handleOpenManualModal(null, null, 'decline')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: `1px solid rgba(239, 68, 68, 0.3)`,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
              color: '#EF4444',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <UserX size={16} />
            Decline Access
          </button>

          <button
            onClick={() => refreshAll?.()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${borderCard}`,
              backgroundColor: bgCard,
              color: textPrimary,
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'settings' ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)' : bgCard,
              color: activeTab === 'settings' ? '#FFFFFF' : textPrimary,
              boxShadow: activeTab === 'settings' ? '0 4px 14px rgba(107, 0, 255, 0.3)' : `0 1px 3px rgba(0,0,0,0.05)`,
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Settings size={15} />
            Config
          </button>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Metric 1: Invoices Generated */}
        <div style={{
          backgroundColor: bgCard,
          border: `1px solid ${borderCard}`,
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Generated Invoices
            </span>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'rgba(107, 0, 255, 0.1)',
              color: '#6B00FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileCheck size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: textPrimary }}>
            {metrics.totalInvoices}
          </div>
          <div style={{ fontSize: '0.76rem', color: textMuted, marginTop: '4px' }}>
            Total billed value: <strong>{formatCurrencyINR(metrics.totalInvoiceValue)}</strong>
          </div>
        </div>

        {/* Metric 2: Add-on Revenue */}
        <div style={{
          backgroundColor: bgCard,
          border: `1px solid ${borderCard}`,
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Add-on Revenue
            </span>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10B981' }}>
            {formatCurrencyINR(metrics.totalAddonRevenue)}
          </div>
          <div style={{ fontSize: '0.76rem', color: textMuted, marginTop: '4px' }}>
            From ₹199 official invoice add-on fees
          </div>
        </div>

        {/* Metric 3: Active Assigned */}
        <div style={{
          backgroundColor: bgCard,
          border: `1px solid ${borderCard}`,
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Assigned (Active)
            </span>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: textPrimary }}>
            {metrics.totalAssigned}
          </div>
          <div style={{ fontSize: '0.76rem', color: textMuted, marginTop: '4px' }}>
            Orders with active generator access
          </div>
        </div>

        {/* Metric 4: Pending Verification */}
        <div style={{
          backgroundColor: bgCard,
          border: `1px solid ${metrics.totalPending > 0 ? 'rgba(245, 158, 11, 0.4)' : borderCard}`,
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Review
            </span>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: metrics.totalPending > 0 ? '#F59E0B' : textPrimary }}>
            {metrics.totalPending}
          </div>
          <div style={{ fontSize: '0.76rem', color: textMuted, marginTop: '4px' }}>
            Add-on requested, awaiting admin approval
          </div>
        </div>

        {/* Metric 5: Active Registered Customers */}
        <div style={{
          backgroundColor: bgCard,
          border: `1px solid ${borderCard}`,
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Customers
            </span>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'rgba(107, 0, 255, 0.1)',
              color: '#6B00FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: textPrimary }}>
            {metrics.totalActiveCustomers}
          </div>
          <div style={{ fontSize: '0.76rem', color: textMuted, marginTop: '4px' }}>
            Registered non-deleted customer accounts
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: `1px solid ${borderCard}`,
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('access')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'access' ? '2px solid #6B00FF' : '2px solid transparent',
            color: activeTab === 'access' ? '#6B00FF' : textMuted,
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <ShieldCheck size={18} />
          Order Access & Entitlements
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.74rem',
            backgroundColor: activeTab === 'access' ? 'rgba(107, 0, 255, 0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
            color: activeTab === 'access' ? '#6B00FF' : textMuted
          }}>
            {activeOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'ledger' ? '2px solid #6B00FF' : '2px solid transparent',
            color: activeTab === 'ledger' ? '#6B00FF' : textMuted,
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <FileSpreadsheet size={18} />
          Generated Tax Invoices Ledger
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.74rem',
            backgroundColor: activeTab === 'ledger' ? 'rgba(107, 0, 255, 0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
            color: activeTab === 'ledger' ? '#6B00FF' : textMuted
          }}>
            {metrics.totalInvoices}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #6B00FF' : '2px solid transparent',
            color: activeTab === 'settings' ? '#6B00FF' : textMuted,
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Sliders size={18} />
          Rules & Entity Settings
        </button>
      </div>

      {/* ====================================================================
          TAB 1: ORDER ACCESS & ENTITLEMENTS (MANUAL ASSIGN / DECLINE)
          ==================================================================== */}
      {activeTab === 'access' && (
        <div>
          {/* Filter & Search Bar */}
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderCard}`,
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              border: `1px solid ${borderCard}`,
              borderRadius: '8px',
              padding: '6px 12px',
              flex: '1 1 280px',
              maxWidth: '420px'
            }}>
              <Search size={16} color={textMuted} />
              <input
                type="text"
                placeholder="Search by Order #, Customer Name, Email, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: textPrimary,
                  fontSize: '0.86rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: textMuted, padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                    border: `1px solid ${borderCard}`,
                    color: textPrimary,
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Orders ({activeOrders.length})</option>
                  <option value="pending">Pending Review ({metrics.totalPending})</option>
                  <option value="assigned">Assigned / Active ({metrics.totalAssigned})</option>
                  <option value="declined">Declined ({metrics.totalDeclined})</option>
                  <option value="not_requested">Standard / Not Requested</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: textMuted }}>Payment:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                    border: `1px solid ${borderCard}`,
                    color: textPrimary,
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid Only</option>
                  <option value="pending">Unpaid / In Review</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderCard}`,
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                    borderBottom: `1px solid ${borderCard}`,
                    color: textMuted,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '12px 16px' }}>Customer Contact</th>
                    <th style={{ padding: '12px 16px' }}>Order Reference</th>
                    <th style={{ padding: '12px 16px' }}>Payment</th>
                    <th style={{ padding: '12px 16px' }}>Add-on Requested</th>
                    <th style={{ padding: '12px 16px' }}>Generator Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: textMuted }}>
                        <Receipt size={40} style={{ margin: '0 auto 12px', opacity: 0.35, color: '#6B00FF' }} />
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary }}>
                          No Orders Require Review
                        </div>
                        <div style={{ fontSize: '0.82rem', marginTop: '6px', maxWidth: '420px', margin: '6px auto 16px' }}>
                          Deleted customers and inactive mock orders have been removed. Click below to manually select any registered customer and grant invoice access.
                        </div>
                        <button
                          onClick={() => handleOpenManualModal(null, null, 'assign')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#6B00FF',
                            color: '#FFFFFF',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <UserCheck size={15} />
                          Assign Customer Manually
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isEligible = Boolean(order.invoiceEligible || order.invoice_eligible);
                      const isDeclined = order.invoiceStatus === 'declined';
                      const hasAddon = Boolean(order.hasInvoiceAddon || order.has_invoice_addon);
                      const isPaid = order.paymentStatus === 'paid';

                      // Find customer object if present
                      const matchingCustomer = activeCustomers.find(c => 
                        c.id === order.customerId || 
                        c.email === order.customerEmail ||
                        (order.customerDetails?.email && c.email === order.customerDetails.email)
                      );

                      let accessBadgeBg = 'rgba(100, 116, 139, 0.1)';
                      let accessBadgeColor = '#64748B';
                      let accessLabel = 'Not Requested';

                      if (isEligible) {
                        accessBadgeBg = 'rgba(16, 185, 129, 0.12)';
                        accessBadgeColor = '#10B981';
                        accessLabel = 'Assigned (Active)';
                      } else if (isDeclined) {
                        accessBadgeBg = 'rgba(239, 68, 68, 0.12)';
                        accessBadgeColor = '#EF4444';
                        accessLabel = 'Declined';
                      } else if (hasAddon) {
                        accessBadgeBg = 'rgba(245, 158, 11, 0.12)';
                        accessBadgeColor = '#F59E0B';
                        accessLabel = 'Pending Review';
                      }

                      return (
                        <tr
                          key={order.id}
                          style={{
                            borderBottom: `1px solid ${borderCard}`,
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          {/* Customer Contact */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: textPrimary }}>
                              {order.customerName || order.design?.front?.name || order.frontConfig?.name || order.customerDetails?.fullName || matchingCustomer?.name || 'Customer'}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: textMuted }}>
                              {order.customerDetails?.email || order.customerEmail || matchingCustomer?.email || '—'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: textMuted }}>
                              {order.customerDetails?.phone || order.customerPhone || matchingCustomer?.phone || '—'}
                            </div>
                          </td>

                          {/* Order Reference */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#6B00FF', fontFamily: 'monospace' }}>
                              {order.orderReference || order.id}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: textMuted, marginTop: '2px' }}>
                              Edition: <strong style={{ textTransform: 'capitalize', color: textPrimary }}>{order.edition || 'Purple'}</strong> ({order.quantity || 1} unit)
                            </div>
                            <div style={{ fontSize: '0.74rem', color: textMuted }}>
                              Amount: <strong>{formatCurrencyINR(order.totalAmount || order.pricingBreakdown?.finalTotal || 0)}</strong>
                            </div>
                          </td>

                          {/* Payment Status */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: isPaid ? '#10B981' : '#F59E0B'
                            }}>
                              {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {isPaid ? 'PAID' : (order.paymentStatus || 'PENDING').toUpperCase()}
                            </span>
                            {order.paymentUTR && (
                              <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '3px' }}>
                                UTR: <span style={{ fontFamily: 'monospace' }}>{order.paymentUTR}</span>
                              </div>
                            )}
                          </td>

                          {/* Add-on Requested */}
                          <td style={{ padding: '14px 16px' }}>
                            {hasAddon ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(107, 0, 255, 0.12)',
                                color: '#6B00FF'
                              }}>
                                <Receipt size={12} />
                                +₹199 Add-on
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: textMuted }}>
                                Standard (No Addon)
                              </span>
                            )}
                          </td>

                          {/* Generator Status */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                backgroundColor: accessBadgeBg,
                                color: accessBadgeColor
                              }}>
                                {isEligible && <Check size={13} />}
                                {isDeclined && <X size={13} />}
                                {!isEligible && !isDeclined && hasAddon && <Clock size={13} />}
                                {accessLabel}
                              </span>
                            </div>
                            {order.invoiceStatusReason && (
                              <div style={{
                                fontSize: '0.72rem',
                                color: textMuted,
                                marginTop: '4px',
                                maxWidth: '200px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }} title={order.invoiceStatusReason}>
                                Reason: {order.invoiceStatusReason}
                              </div>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {/* Assign Button */}
                              {!isEligible && (
                                <button
                                  onClick={() => handleOpenManualModal(matchingCustomer, order, 'assign')}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#10B981',
                                    color: '#FFFFFF',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                                  }}
                                  title="Manually assign invoice generator access"
                                >
                                  <Check size={13} />
                                  Assign
                                </button>
                              )}

                              {/* Decline Button */}
                              {isEligible ? (
                                <button
                                  onClick={() => handleOpenManualModal(matchingCustomer, order, 'decline')}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: `1px solid rgba(239, 68, 68, 0.3)`,
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#EF4444',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Revoke active generator access"
                                >
                                  <X size={13} />
                                  Revoke
                                </button>
                              ) : (
                                !isDeclined && (
                                  <button
                                    onClick={() => handleOpenManualModal(matchingCustomer, order, 'decline')}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      border: `1px solid ${borderCard}`,
                                      backgroundColor: 'transparent',
                                      color: textMuted,
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                    title="Decline invoice request"
                                  >
                                    <X size={13} />
                                    Decline
                                  </button>
                                )
                              )}

                              {/* Preview / Sample Invoice */}
                              <button
                                onClick={() => openOrderPreview(order)}
                                style={{
                                  padding: '6px',
                                  borderRadius: '8px',
                                  border: `1px solid ${borderCard}`,
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                                  color: textPrimary,
                                  cursor: 'pointer'
                                }}
                                title="Preview / Download Tax Invoice"
                              >
                                <Eye size={15} />
                              </button>

                              {/* WhatsApp Direct Share */}
                              {(order.customerDetails?.phone || matchingCustomer?.phone) && (
                                <a
                                  href={`https://wa.me/${(order.customerDetails?.phone || matchingCustomer?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Hello ${order.customerName || order.design?.front?.name || order.frontConfig?.name || order.customerDetails?.fullName || matchingCustomer?.name || 'Customer'},\nYour FLOCARDS order ${order.orderReference || order.id} invoice status: ${isEligible ? 'ASSIGNED & ACTIVE. You can now generate official tax invoices in your dashboard.' : 'UPDATED'}\nThank you!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    border: `1px solid rgba(16, 185, 129, 0.3)`,
                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                    color: '#10B981',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                  title="WhatsApp Customer Update"
                                >
                                  <MessageCircle size={15} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: GENERATED TAX INVOICES LEDGER
          ==================================================================== */}
      {activeTab === 'ledger' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderCard}`,
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              border: `1px solid ${borderCard}`,
              borderRadius: '8px',
              padding: '6px 12px',
              width: '100%',
              maxWidth: '380px'
            }}>
              <Search size={16} color={textMuted} />
              <input
                type="text"
                placeholder="Search by Invoice #, Order Reference, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: textPrimary,
                  fontSize: '0.86rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: textMuted }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.82rem', color: textMuted }}>
              Showing <strong>{filteredInvoices.length}</strong> tax invoices generated across customers
            </div>
          </div>

          {/* Invoices Table */}
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderCard}`,
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                    borderBottom: `1px solid ${borderCard}`,
                    color: textMuted,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '12px 16px' }}>Invoice Number</th>
                    <th style={{ padding: '12px 16px' }}>Order Reference</th>
                    <th style={{ padding: '12px 16px' }}>Billed To</th>
                    <th style={{ padding: '12px 16px' }}>Issue Date</th>
                    <th style={{ padding: '12px 16px' }}>GSTIN</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tax (18%)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total (₹)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: textMuted }}>
                        <FileSpreadsheet size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: textPrimary }}>No Generated Invoices Found</div>
                        <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Invoices generated by customers or downloaded will appear here.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id || inv.invoiceNumber} style={{ borderBottom: `1px solid ${borderCard}` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6B00FF' }}>
                            {inv.invoiceNumber}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: textPrimary }}>
                          {inv.orderReference || '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: textPrimary }}>
                            {inv.customerName || inv.billedTo?.name || 'Customer'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: textMuted }}>
                            {inv.billedTo?.email || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: textMuted }}>
                          {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.80rem' }}>
                          {inv.billedTo?.gstin || <span style={{ color: textMuted }}>Unregistered</span>}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: textMuted }}>
                          {formatCurrencyINR(inv.taxAmount || inv.totalTax || 0)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: textPrimary }}>
                          {formatCurrencyINR(inv.total || inv.finalTotal || 0)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              const matchingOrder = orders.find(o => o.orderReference === inv.orderReference || o.id === inv.orderId);
                              if (matchingOrder) {
                                openOrderPreview(matchingOrder);
                              } else {
                                showToast('Order record not found for PDF export', 'error');
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${borderCard}`,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                              color: textPrimary,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={13} />
                            PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv)}
                            title="Delete Invoice"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: '#EF4444',
                              cursor: 'pointer',
                              marginLeft: '6px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: INVOICE RULES & BUSINESS ENTITY SETTINGS
          ==================================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} style={{
          backgroundColor: bgCard,
          border: `1px solid ${borderCard}`,
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          maxWidth: '850px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Building2 size={22} color="#6B00FF" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: textPrimary }}>
                Invoice Pricing & Official Business Entity
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: textMuted }}>
                Configure the ₹199 add-on feature, tax calculations, and official seller details printed on all tax invoices.
              </p>
            </div>
          </div>

          {settingsSuccess && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={16} />
              Settings saved successfully!
            </div>
          )}

          {/* Core Feature Toggles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
            border: `1px solid ${borderCard}`
          }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={invoiceConfig.enabled}
                  onChange={(e) => setInvoiceConfigState(prev => ({ ...prev, enabled: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#6B00FF' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textPrimary }}>
                    Enable Invoice Generator Feature
                  </div>
                  <div style={{ fontSize: '0.76rem', color: textMuted }}>
                    Offer the official business tax invoice add-on at checkout and customer dashboard.
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                Invoice Add-on Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={invoiceConfig.addonFee}
                onChange={(e) => setInvoiceConfigState(prev => ({ ...prev, addonFee: Number(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.88rem',
                  fontWeight: 700
                }}
              />
            </div>
          </div>

          {/* Official Business Details Grid */}
          <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: textPrimary }}>
            Authoritative Seller Information (Printed on Tax Invoices)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                Legal Entity Name
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.legalEntity || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, legalEntity: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                Brand Name
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.brandName || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, brandName: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                GSTIN Number
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.gstin || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, gstin: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontFamily: 'monospace',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                SAC / HSN Code
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.sacCode || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, sacCode: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontFamily: 'monospace',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                GST Tax Rate
              </label>
              <select
                value={invoiceConfig.taxRate}
                onChange={(e) => setInvoiceConfigState(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.86rem'
                }}
              >
                <option value={0.18}>18% GST (9% CGST + 9% SGST)</option>
                <option value={0.12}>12% GST (6% CGST + 6% SGST)</option>
                <option value={0.05}>5% GST (2.5% CGST + 2.5% SGST)</option>
                <option value={0}>0% (Tax Exempt)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                Registered Address
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.addressLine1 || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, addressLine1: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                City & State
              </label>
              <input
                type="text"
                value={`${invoiceConfig.business?.city || ''}, ${invoiceConfig.business?.state || ''}`}
                onChange={(e) => {
                  const [city = '', state = ''] = e.target.value.split(',').map(s => s.trim());
                  setInvoiceConfigState(prev => ({
                    ...prev,
                    business: { ...prev.business, city, state }
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                Postal Code
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.postalCode || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, postalCode: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                Official Bank Name
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.bankName || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, bankName: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                Account Number
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.accountNumber || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, accountNumber: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontFamily: 'monospace',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                IFSC Code
              </label>
              <input
                type="text"
                value={invoiceConfig.business?.ifscCode || ''}
                onChange={(e) => setInvoiceConfigState(prev => ({
                  ...prev,
                  business: { ...prev.business, ifscCode: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCard}`,
                  backgroundColor: bgCard,
                  color: textPrimary,
                  fontFamily: 'monospace',
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.90rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(107, 0, 255, 0.3)'
              }}
            >
              <Check size={16} />
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* ====================================================================
          MODAL: MANUALLY ASSIGN OR DECLINE INVOICE GENERATOR ACCESS
          Allows admin to select any active registered customer and specific order
          ==================================================================== */}
      {showManualModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderCard}`,
            borderRadius: '16px',
            padding: '26px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.45)'
          }}>
            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: modalActionType === 'assign' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: modalActionType === 'assign' ? '#10B981' : '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {modalActionType === 'assign' ? <UserCheck size={22} /> : <UserX size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: textPrimary }}>
                    {modalActionType === 'assign' ? 'Assign Invoice Generator Access' : 'Decline / Revoke Invoice Access'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: textMuted }}>
                    Manually select an active customer and choose entitlement scope
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowManualModal(false)}
                style={{ border: 'none', background: 'none', color: textMuted, cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Type Toggle */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '4px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
              marginBottom: '18px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setModalActionType('assign');
                  setModalReason('Payment verified & approved for tax invoice generator access');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: modalActionType === 'assign' ? '#10B981' : 'transparent',
                  color: modalActionType === 'assign' ? '#FFFFFF' : textMuted,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Check size={14} />
                Assign (Enable)
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalActionType('decline');
                  setModalReason('Invoice add-on fee unpaid or unverified payment');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: modalActionType === 'decline' ? '#EF4444' : 'transparent',
                  color: modalActionType === 'decline' ? '#FFFFFF' : textMuted,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <X size={14} />
                Decline (Revoke)
              </button>
            </div>

            <form onSubmit={handleManualAssignmentSubmit}>
              {/* STEP 1: Select Active Customer */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textMuted, marginBottom: '6px' }}>
                  1. Select Customer (Active Non-Deleted Customers Only)
                </label>
                {activeCustomers.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                    border: `1px solid ${borderCard}`,
                    color: textMuted,
                    fontSize: '0.84rem'
                  }}>
                    No active customers registered yet. Place an order or add a customer first.
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setSelectedOrderId('all');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${borderCard}`,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                      color: textPrimary,
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {activeCustomers.map(cust => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name || 'Unnamed Customer'} — {cust.email} {cust.phone ? `(${cust.phone})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* STEP 2: Select Scope / Specific Order */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textMuted, marginBottom: '6px' }}>
                  2. Select Order / Entitlement Scope
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${borderCard}`,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    color: textPrimary,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">
                    ✓ All Orders (Account-Level Access for this Customer)
                  </option>
                  {customerOrdersForModal.map(ord => (
                    <option key={ord.id} value={ord.id}>
                      Order {ord.orderReference || ord.id} — {ord.edition || 'Purple'} Edition ({formatCurrencyINR(ord.totalAmount || 0)})
                    </option>
                  ))}
                </select>
                {customerOrdersForModal.length === 0 && selectedCustomerId && (
                  <div style={{ fontSize: '0.74rem', color: textMuted, marginTop: '4px' }}>
                    Note: This customer has no placed orders yet. Setting account-level access will enable their generator immediately.
                  </div>
                )}
              </div>

              {/* STEP 3: Reason / Audit Note */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textMuted, marginBottom: '6px' }}>
                  3. Audit Reason (Recorded in Activity Feed & Sent in Notification)
                </label>
                <textarea
                  rows={2}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="e.g., Payment verified via UPI UTR / Corporate agreement"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${borderCard}`,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                    color: textPrimary,
                    fontSize: '0.84rem',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  disabled={modalLoading}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${borderCard}`,
                    backgroundColor: 'transparent',
                    color: textPrimary,
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={modalLoading || (activeCustomers.length === 0 && !selectedCustomerId)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: modalActionType === 'assign' ? '#10B981' : '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: modalActionType === 'assign' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {modalLoading && <RefreshCw size={14} className="animate-spin" />}
                  {modalActionType === 'assign' ? 'Confirm & Grant Access' : 'Confirm & Decline Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          PREVIEW MODAL: LIVE A4 TAX INVOICE PREVIEW & DOWNLOAD
          ==================================================================== */}
      {previewOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: bgCard,
            border: `1px solid ${borderCard}`,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${borderCard}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="#6B00FF" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                    Official Tax Invoice & Bill Generator
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: textMuted }}>
                    Order: {previewOrder.orderReference || previewOrder.id} • Customer: {adminCustomDetails.customerName || previewOrder.customerName || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Theme Selector */}
                <select
                  value={previewThemeId}
                  onChange={(e) => setPreviewThemeId(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${borderCard}`,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                    color: textPrimary,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {INVOICE_THEMES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleDownloadOrderPDF(previewOrder)}
                  disabled={isExporting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#6B00FF',
                    color: '#FFFFFF',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  {isExporting ? 'Generating...' : 'Download PDF'}
                </button>

                <button
                  onClick={() => setPreviewOrder(null)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: textMuted, padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sub-Header Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderBottom: `1px solid ${borderCard}`,
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC'
            }}>
              <button
                onClick={() => setPreviewActiveTab('preview')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: previewActiveTab === 'preview' ? '#6B00FF' : 'transparent',
                  color: previewActiveTab === 'preview' ? '#FFFFFF' : textMuted
                }}
              >
                <Eye size={13} />
                Live A4 Preview
              </button>

              <button
                onClick={() => setPreviewActiveTab('details')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: previewActiveTab === 'details' ? '#6B00FF' : 'transparent',
                  color: previewActiveTab === 'details' ? '#FFFFFF' : textMuted
                }}
              >
                <User size={13} />
                User & Client Details
              </button>

              <button
                onClick={() => setPreviewActiveTab('items')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: previewActiveTab === 'items' ? '#6B00FF' : 'transparent',
                  color: previewActiveTab === 'items' ? '#FFFFFF' : textMuted
                }}
              >
                <CreditCard size={13} />
                Custom Line Items ({adminCustomItems.length})
              </button>
            </div>

            {/* Modal Body Based on Active Tab */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: isDark ? '#0D0914' : '#F9FAFB' }}>
              {/* TAB 1: CUSTOM USER & CLIENT DETAILS */}
              {previewActiveTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(107, 0, 255, 0.12)' : '#F3EEFF',
                    border: '1px solid rgba(107, 0, 255, 0.25)',
                    fontSize: '0.80rem',
                    color: isDark ? '#D8B4FE' : '#6B00FF'
                  }}>
                    💡 <strong>Custom Client Details:</strong> Edit customer details below. These custom values will be printed in the Billed To / Consignee section of the live preview and exported PDF.
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '14px',
                    backgroundColor: bgCard,
                    padding: '16px',
                    borderRadius: '10px',
                    border: `1px solid ${borderCard}`
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                        Customer / Recipient Full Name
                      </label>
                      <input
                        type="text"
                        value={adminCustomDetails.customerName}
                        onChange={(e) => setAdminCustomDetails(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="e.g. John Doe"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        value={adminCustomDetails.company}
                        onChange={(e) => setAdminCustomDetails(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="e.g. Acme Innovations Corp"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                        Place of Supply / City
                      </label>
                      <input
                        type="text"
                        value={adminCustomDetails.place || ''}
                        onChange={(e) => setAdminCustomDetails(prev => ({ ...prev, place: e.target.value }))}
                        placeholder="e.g. Indiranagar, Bengaluru or Kochi, Kerala"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={adminCustomDetails.email}
                        onChange={(e) => setAdminCustomDetails(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="customer@domain.com"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={adminCustomDetails.phone}
                        onChange={(e) => setAdminCustomDetails(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                        Delivery / Billing Address
                      </label>
                      <input
                        type="text"
                        value={adminCustomDetails.shippingAddress}
                        onChange={(e) => setAdminCustomDetails(prev => ({ ...prev, shippingAddress: e.target.value }))}
                        placeholder="Suite 404, Tech Park, Indiranagar, Bengaluru, KA - 560038"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                        Customer GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        value={adminCustomDetails.gstin}
                        onChange={(e) => setAdminCustomDetails(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                        placeholder="29ABCDE1234F1Z5"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      onClick={() => setPreviewActiveTab('items')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: '#6B00FF',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.80rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Next: Custom Line Items →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOM LINE ITEMS & ITEM NAMES */}
              {previewActiveTab === 'items' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(107, 0, 255, 0.12)' : '#F3EEFF',
                    border: '1px solid rgba(107, 0, 255, 0.25)',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: isDark ? '#D8B4FE' : '#6B00FF' }}>
                        Custom Line Items & Item Names:
                      </strong>
                      <div style={{ fontSize: '0.74rem', color: textMuted }}>
                        Rename items, adjust quantities, modify unit rates (₹), or add custom deliverables.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleAdminAddItem}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#6B00FF',
                          color: '#FFFFFF',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={13} />
                        Add Line Item
                      </button>
                      <button
                        onClick={handleAdminResetItems}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${borderCard}`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                          color: textPrimary,
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={12} />
                        Reset Defaults
                      </button>
                    </div>
                  </div>

                  {/* List of Line Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {adminCustomItems.map((item, index) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: bgCard,
                          border: `1px solid ${borderCard}`,
                          borderRadius: '10px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: textMuted, width: '20px' }}>
                            #{index + 1}
                          </span>

                          {/* Item Title / Name */}
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '0.70rem', color: textMuted, marginBottom: '2px' }}>
                              Item Title / Product Name
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleAdminUpdateItem(item.id, 'title', e.target.value)}
                              placeholder="e.g. FLOCARD Smart NFC Card (Purple Edition)"
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${borderCard}`,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                color: textPrimary,
                                fontSize: '0.80rem',
                                fontWeight: 600,
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* HSN */}
                          <div style={{ width: '80px' }}>
                            <label style={{ display: 'block', fontSize: '0.70rem', color: textMuted, marginBottom: '2px' }}>
                              HSN/SAC
                            </label>
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleAdminUpdateItem(item.id, 'hsn', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${borderCard}`,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                color: textPrimary,
                                fontSize: '0.80rem',
                                outline: 'none',
                                textAlign: 'center'
                              }}
                            />
                          </div>

                          {/* Qty */}
                          <div style={{ width: '60px' }}>
                            <label style={{ display: 'block', fontSize: '0.70rem', color: textMuted, marginBottom: '2px' }}>
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleAdminUpdateItem(item.id, 'qty', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${borderCard}`,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                color: textPrimary,
                                fontSize: '0.80rem',
                                outline: 'none',
                                textAlign: 'center'
                              }}
                            />
                          </div>

                          {/* Rate */}
                          <div style={{ width: '100px' }}>
                            <label style={{ display: 'block', fontSize: '0.70rem', color: textMuted, marginBottom: '2px' }}>
                              Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleAdminUpdateItem(item.id, 'rate', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${borderCard}`,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                color: textPrimary,
                                fontSize: '0.80rem',
                                outline: 'none',
                                textAlign: 'right'
                              }}
                            />
                          </div>

                          {/* Amount */}
                          <div style={{ width: '90px', textAlign: 'right' }}>
                            <label style={{ display: 'block', fontSize: '0.70rem', color: textMuted, marginBottom: '2px' }}>
                              Amount (₹)
                            </label>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6B00FF', padding: '6px 0' }}>
                              ₹{Number(item.amount || 0).toFixed(2)}
                            </div>
                          </div>

                          {/* Delete Item */}
                          {adminCustomItems.length > 1 && (
                            <button
                              onClick={() => handleAdminRemoveItem(item.id)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: '#EF4444',
                                cursor: 'pointer',
                                marginTop: '16px'
                              }}
                              title="Delete Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Subtitle / Description */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.70rem', color: textMuted, marginBottom: '2px' }}>
                            Item Subtitle / Specifications
                          </label>
                          <input
                            type="text"
                            value={item.subtitle || ''}
                            onChange={(e) => handleAdminUpdateItem(item.id, 'subtitle', e.target.value)}
                            placeholder="e.g. Premium contactless business card embedded with NXP NTAG216 chip"
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: `1px solid ${borderCard}`,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                              color: textMuted,
                              fontSize: '0.76rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Bar */}
                  <div style={{
                    backgroundColor: bgCard,
                    border: `1px solid ${borderCard}`,
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: textMuted }}>
                      Subtotal: <strong>₹{adminTotals.taxableBase.toFixed(2)}</strong> | CGST (9%): <strong>₹{adminTotals.cgstAmount.toFixed(2)}</strong> | SGST (9%): <strong>₹{adminTotals.sgstAmount.toFixed(2)}</strong>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#6B00FF' }}>
                      Grand Total: ₹{adminTotals.totalAmount.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      onClick={() => setPreviewActiveTab('preview')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: '#6B00FF',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.80rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View Live A4 Preview →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE A4 TAX INVOICE PREVIEW */}
              {previewActiveTab === 'preview' && (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E5E7EB', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#6B00FF' }}>
                        {invoiceConfig.business?.brandName || 'FLOCARDS'}
                      </h2>
                      <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
                        {invoiceConfig.business?.legalEntity}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                        GSTIN: <strong>{invoiceConfig.business?.gstin}</strong> | SAC: {invoiceConfig.business?.sacCode}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                        {invoiceConfig.business?.addressLine1}, {invoiceConfig.business?.city}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>
                        TAX INVOICE
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6B00FF', fontWeight: 700, fontFamily: 'monospace' }}>
                        {previewOrder.invoiceNumber || `INV-${new Date().getFullYear()}-${String(previewOrder.id || '0001').slice(-4).toUpperCase()}`}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '2px' }}>
                        Date: {new Date().toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Billed To with Custom Details */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>
                      Billed To (Customer):
                    </div>
                    <div style={{ fontSize: '0.90rem', fontWeight: 700, color: '#111827' }}>
                      {adminCustomDetails.customerName || previewOrder.customerDetails?.fullName || previewOrder.customerName || 'Customer Name'}
                    </div>
                    {adminCustomDetails.company && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>
                        {adminCustomDetails.company}
                      </div>
                    )}
                    {(adminCustomDetails.place || previewOrder.city) && (
                      <div style={{ fontSize: '0.76rem', color: '#4B5563', fontWeight: 600 }}>
                        Place of Supply: {adminCustomDetails.place || previewOrder.city}
                      </div>
                    )}
                    <div style={{ fontSize: '0.76rem', color: '#4B5563' }}>
                      {adminCustomDetails.email || previewOrder.customerDetails?.email || previewOrder.customerEmail}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#4B5563' }}>
                      {adminCustomDetails.phone || previewOrder.customerDetails?.phone || previewOrder.customerPhone}
                    </div>
                    {(adminCustomDetails.shippingAddress || previewOrder.customerDetails?.address) && (
                      <div style={{ fontSize: '0.76rem', color: '#4B5563', marginTop: '2px' }}>
                        {adminCustomDetails.shippingAddress || `${previewOrder.customerDetails.address}, ${previewOrder.customerDetails.city || ''} - ${previewOrder.customerDetails.postalCode || ''}`}
                      </div>
                    )}
                    {adminCustomDetails.gstin && (
                      <div style={{ fontSize: '0.74rem', color: '#6B00FF', fontWeight: 700, marginTop: '2px' }}>
                        Buyer GSTIN: {adminCustomDetails.gstin}
                      </div>
                    )}
                  </div>

                  {/* Pricing Table with Custom Items */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.80rem', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F3EEFF', color: '#6B00FF' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Description</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>HSN</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCustomItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{item.title}</div>
                            {item.subtitle && (
                              <div style={{ fontSize: '0.70rem', color: '#6B7280' }}>{item.subtitle}</div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6B7280' }}>{item.hsn || '-'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.qty}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            {Number(item.rate || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                            {Number(item.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>Taxable Subtotal:</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          ₹{adminTotals.taxableBase.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ padding: '4px 10px', textAlign: 'right', color: '#6B7280' }}>CGST (9%):</td>
                        <td style={{ padding: '4px 10px', textAlign: 'right', color: '#6B7280' }}>
                          ₹{adminTotals.cgstAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ padding: '4px 10px', textAlign: 'right', color: '#6B7280' }}>SGST (9%):</td>
                        <td style={{ padding: '4px 10px', textAlign: 'right', color: '#6B7280' }}>
                          ₹{adminTotals.sgstAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ borderTop: '2px solid #E5E7EB' }}>
                        <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, fontSize: '0.90rem' }}>
                          Grand Total Payable:
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, fontSize: '0.90rem', color: '#6B00FF' }}>
                          ₹{adminTotals.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Bank / Footer */}
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', borderTop: '1px dashed #D1D5DB', paddingTop: '12px' }}>
                    Bank: {invoiceConfig.business?.bankName} | A/C: {invoiceConfig.business?.accountNumber} | IFSC: {invoiceConfig.business?.ifscCode}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 60FPS Thermal Receipt Printing & Digitally Signed Animation */}
      <ReceiptPrintAnimation
        isOpen={!!printReceiptData}
        title="FLOCARDS TAX INVOICE"
        invoiceNumber={printReceiptData?.invoiceNumber || "INV-2026-0001"}
        customerName={printReceiptData?.customerName || "Valued Client"}
        totalAmount={printReceiptData?.totalAmount || "₹1,899"}
        items={printReceiptData?.items || []}
        onComplete={() => {
          setTimeout(() => setPrintReceiptData(null), 1800);
        }}
        onClose={() => setPrintReceiptData(null)}
      />
    </div>
  );
}
