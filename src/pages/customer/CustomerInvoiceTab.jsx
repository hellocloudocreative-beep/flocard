/* ==========================================================================
   FLOCARDS CUSTOMER INVOICE GENERATOR & THEME CUSTOMIZER
   Allows customers to generate, visually theme, preview, and download
   print-ready A4 Tax Invoices for eligible NFC card orders.
   Visual-only styling preserves immutable financial amounts and GST calculations.
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Download,
  Eye,
  Palette,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Edit3,
  Plus,
  Trash2,
  User,
  Sliders,
  PlusCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateOrderPricing, DEFAULT_BUSINESS_DETAILS, generateInvoiceNumber } from '../../lib/orderPricing';
import { INVOICE_THEMES, getInvoiceTheme, downloadInvoicePDF } from '../../lib/invoicePdfExport';
import { getPrintOrderWhatsAppUrl } from '../../lib/whatsapp';
import { BRAND } from '../../lib/constants';

export default function CustomerInvoiceTab({ orders = [], customer = null }) {
  const { theme, isDark, isLight } = useTheme();
  const { saveInvoice, getInvoicesByCustomer } = useData();

  // Find orders that belong to this customer
  const customerOrders = useMemo(() => {
    return (orders || []).filter(o => Boolean(o.id));
  }, [orders]);

  const [isCustomMode, setIsCustomMode] = useState(true);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('INV-2026-3776');
  const [selectedOrderId, setSelectedOrderId] = useState('custom');
  const [activeControlTab, setActiveControlTab] = useState('items'); // 'items' | 'details' | 'theme'
  const [selectedThemeId, setSelectedThemeId] = useState('midnight_purple');
  const [headerStyle, setHeaderStyle] = useState('bold_banner'); // 'bold_banner' | 'classic' | 'minimal'
  const [logoPlacement, setLogoPlacement] = useState('left'); // 'left' | 'center' | 'right'
  const [customAccent, setCustomAccent] = useState('#6B00FF');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');
  const [savedInvoices, setSavedInvoices] = useState([]);

  // Custom User / Customer Details State (with Place / City)
  const [customDetails, setCustomDetails] = useState({
    customerName: customer?.name || 'Flocard Admin',
    place: 'Indiranagar, Bengaluru',
    company: 'FLOCARD Enterprise',
    phone: customer?.phone || '+91 97782 78552',
    email: customer?.email || 'hello.flocard@gmail.com',
    shippingAddress: 'Plot 42, Infopark Kochi, Kerala 682042',
    gstin: ''
  });

  // Custom Line Items State
  const [customItems, setCustomItems] = useState([
    {
      id: 'item_init_1',
      title: 'FLOCARDS Smart NFC Business Card — PURPLE Edition',
      subtitle: 'NFC Embedded Matte Polymer Card + Dynamic Live Digital Profile',
      hsn: '998439',
      qty: 1,
      rate: 1899,
      amount: 1899
    },
    {
      id: 'item_init_2',
      title: 'Tax Invoice & Business Compliance Add-On',
      subtitle: 'Official tax invoice issuance, audit trail & digital PDF export',
      hsn: '998439',
      qty: 1,
      rate: 199,
      amount: 199
    }
  ]);

  // Active selected order
  const selectedOrder = useMemo(() => {
    if (isCustomMode) return null;
    return customerOrders.find(o => o.id === selectedOrderId) || null;
  }, [customerOrders, selectedOrderId, isCustomMode]);

  // Load existing invoices for this customer
  const loadSavedInvoices = () => {
    if (customer && getInvoicesByCustomer) {
      const list = getInvoicesByCustomer(customer.id || customer.email);
      setSavedInvoices(list || []);
    }
  };

  useEffect(() => {
    loadSavedInvoices();
  }, [customer]);

  // Check eligibility for the active order or customer account
  const isEligible = Boolean(
    isCustomMode ||
    (selectedOrder &&
      (selectedOrder.hasInvoiceAddon ||
       selectedOrder.has_invoice_addon ||
       selectedOrder.invoiceEligible ||
       selectedOrder.invoice_eligible)) ||
    customer?.invoiceEligible ||
    customer?.invoice_eligible
  );

  // Compute or reuse server pricing
  const pricing = useMemo(() => {
    if (!selectedOrder) {
      return calculateOrderPricing({ edition: 'purple', quantity: 1, hasInvoiceAddon: false });
    }
    return calculateOrderPricing({
      edition: selectedOrder.edition || 'purple',
      quantity: selectedOrder.quantity || 1,
      customizationCharge: selectedOrder.pricingBreakdown?.customizationCharge || 0,
      deliveryCharge: selectedOrder.pricingBreakdown?.deliveryCharge || 0,
      hasInvoiceAddon: isEligible
    });
  }, [selectedOrder, isEligible]);

  // Build default line items for an order
  const buildDefaultItems = (orderObj, pricingObj) => {
    if (!orderObj) return [];
    const editionName = (orderObj.edition || 'Purple').toUpperCase();
    const qty = orderObj.quantity || 1;
    const unitPrice = pricingObj?.unitPrice || 1499;

    const items = [
      {
        id: 'item_crd_1',
        title: `FLOCARDS Smart NFC Business Card — ${editionName} Edition`,
        subtitle: 'NFC Embedded Matte Polymer Card + Dynamic Live Digital Profile',
        hsn: '998439',
        qty: qty,
        rate: unitPrice,
        amount: unitPrice * qty
      }
    ];

    if (pricingObj?.customizationCharge > 0) {
      items.push({
        id: 'item_crd_2',
        title: 'Custom Laser / Artwork Studio Setup Fee',
        subtitle: 'High-precision dual-sided UV print & alignment setup',
        hsn: '998314',
        qty: 1,
        rate: pricingObj.customizationCharge,
        amount: pricingObj.customizationCharge
      });
    }

    if (pricingObj?.invoiceAddonCharge > 0) {
      items.push({
        id: 'item_crd_3',
        title: 'Tax Invoice & Business Compliance Add-On',
        subtitle: 'Official tax invoice issuance, audit trail & digital PDF export',
        hsn: '998439',
        qty: 1,
        rate: pricingObj.invoiceAddonCharge,
        amount: pricingObj.invoiceAddonCharge
      });
    }

    if (pricingObj?.deliveryCharge > 0) {
      items.push({
        id: 'item_crd_4',
        title: 'Insured Tracked Courier Delivery',
        subtitle: 'Doorstep surface courier with tamper-evident packaging',
        hsn: '996812',
        qty: 1,
        rate: pricingObj.deliveryCharge,
        amount: pricingObj.deliveryCharge
      });
    }

    return items;
  };

  // Start creating a brand-new custom invoice
  const handleStartNewInvoice = () => {
    setIsCustomMode(true);
    setSelectedOrderId('custom');
    const newInvNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setCustomInvoiceNumber(newInvNo);
    setCustomDetails({
      customerName: customer?.name || 'Flocard Admin',
      place: 'Indiranagar, Bengaluru',
      company: 'FLOCARD Enterprise',
      phone: customer?.phone || '+91 97782 78552',
      email: customer?.email || 'hello.flocard@gmail.com',
      shippingAddress: 'Plot 42, Infopark Kochi, Kerala 682042',
      gstin: ''
    });
    setCustomItems([
      {
        id: `item_${Date.now()}_1`,
        title: 'FLOCARDS Smart NFC Business Card — PURPLE Edition',
        subtitle: 'NFC Embedded Matte Polymer Card + Dynamic Live Digital Profile',
        hsn: '998439',
        qty: 1,
        rate: 1899,
        amount: 1899
      },
      {
        id: `item_${Date.now()}_2`,
        title: 'Tax Invoice & Business Compliance Add-On',
        subtitle: 'Official tax invoice issuance, audit trail & digital PDF export',
        hsn: '998439',
        qty: 1,
        rate: 199,
        amount: 199
      }
    ]);
  };

  const handleSelectOrder = (orderId) => {
    if (orderId === 'custom' || !orderId) {
      handleStartNewInvoice();
      return;
    }
    setIsCustomMode(false);
    setSelectedOrderId(orderId);
  };

  // Sync custom details and items whenever the selected order changes (only in order mode)
  useEffect(() => {
    if (selectedOrder && !isCustomMode) {
      setCustomDetails({
        customerName: selectedOrder.customerName || selectedOrder.customerDetails?.fullName || customer?.name || 'Customer Name',
        place: selectedOrder.customerDetails?.city || selectedOrder.city || 'Indiranagar, Bengaluru',
        company: selectedOrder.company || selectedOrder.billingDetails?.company || selectedOrder.customerDetails?.company || '',
        phone: selectedOrder.customerPhone || selectedOrder.customerDetails?.phone || customer?.phone || '',
        email: selectedOrder.customerEmail || selectedOrder.customerDetails?.email || customer?.email || '',
        shippingAddress: selectedOrder.shippingAddress || selectedOrder.shipping_address || (selectedOrder.customerDetails?.address ? `${selectedOrder.customerDetails.address}, ${selectedOrder.customerDetails.city || ''} ${selectedOrder.customerDetails.postalCode || ''}` : 'Standard Delivery'),
        gstin: selectedOrder.billingDetails?.gstin || selectedOrder.customerDetails?.gstin || ''
      });
      setCustomItems(buildDefaultItems(selectedOrder, pricing));
    }
  }, [selectedOrder?.id, isCustomMode]);

  // Compute live totals from customItems
  const customTotals = useMemo(() => {
    if (!customItems || customItems.length === 0) {
      return {
        taxableBase: pricing.taxableBase,
        cgstAmount: pricing.cgstAmount,
        sgstAmount: pricing.sgstAmount,
        totalAmount: pricing.totalAmount
      };
    }
    const taxableBase = customItems.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)), 0);
    const cgstAmount = Math.round(taxableBase * 0.09 * 100) / 100;
    const sgstAmount = Math.round(taxableBase * 0.09 * 100) / 100;
    const totalAmount = Math.round((taxableBase + cgstAmount + sgstAmount) * 100) / 100;
    return {
      taxableBase,
      cgstAmount,
      sgstAmount,
      totalAmount
    };
  }, [customItems, pricing]);

  // Active selected or custom order object (never null, ensures preview and export always work)
  const effectiveOrder = useMemo(() => {
    if (!isCustomMode && selectedOrder) return selectedOrder;
    return {
      id: customInvoiceNumber || 'INV-2026-3776',
      orderReference: customInvoiceNumber || 'INV-2026-3776',
      customerName: customDetails.customerName || customer?.name || 'Flocard Admin',
      customerEmail: customDetails.email || customer?.email || 'hello.flocard@gmail.com',
      customerPhone: customDetails.phone || customer?.phone || '+91 97782 78552',
      shippingAddress: customDetails.shippingAddress || 'Plot 42, Infopark Kochi, Kerala 682042',
      paymentStatus: 'payment_confirmed',
      payment_status: 'payment_confirmed',
      city: customDetails.place || 'Indiranagar, Bengaluru',
      totalAmount: customTotals.totalAmount,
      hasInvoiceAddon: true,
      has_invoice_addon: true,
      invoiceEligible: true,
      invoice_eligible: true
    };
  }, [selectedOrder, isCustomMode, customInvoiceNumber, customDetails, customTotals, customer]);

  // Item management actions (supports smooth keystroke typing, backspacing without snapping)
  const handleUpdateItem = (index, field, value) => {
    setCustomItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      const q = field === 'qty' ? (value === '' ? '' : (parseFloat(value) || 0)) : (item.qty === '' ? 1 : (parseFloat(item.qty) || 0));
      const r = field === 'rate' ? (value === '' ? '' : (parseFloat(value) || 0)) : (item.rate === '' ? 0 : (parseFloat(item.rate) || 0));
      item.amount = Math.round((Number(q) || 0) * (Number(r) || 0) * 100) / 100;
      copy[index] = item;
      return copy;
    });
  };

  const handleAddItem = () => {
    setCustomItems(prev => [
      ...prev,
      {
        id: `item_custom_${Date.now()}`,
        title: 'Custom Product / Service',
        subtitle: 'Additional customized deliverables or services',
        hsn: '998439',
        qty: 1,
        rate: 500,
        amount: 500
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (customItems.length <= 1) return;
    setCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetItems = () => {
    if (selectedOrder && !isCustomMode) {
      setCustomItems(buildDefaultItems(selectedOrder, pricing));
    } else {
      handleStartNewInvoice();
    }
  };

  // Invoice Number
  const invoiceNumber = useMemo(() => {
    if (isCustomMode && customInvoiceNumber) return customInvoiceNumber;
    if (!selectedOrder) return customInvoiceNumber || 'INV-2026-3776';
    const existing = savedInvoices.find(inv => inv.orderId === selectedOrder.id);
    if (existing?.invoiceNumber) return existing.invoiceNumber;
    return generateInvoiceNumber(selectedOrder.id);
  }, [selectedOrder, savedInvoices, isCustomMode, customInvoiceNumber]);

  const activeTheme = getInvoiceTheme(selectedThemeId);

  // Download PDF Handler with custom items and user details (always uses effectiveOrder)
  const handleDownloadPDF = async () => {
    const targetOrder = effectiveOrder;
    if (!targetOrder) return;
    setIsDownloading(true);
    setDownloadSuccess('');
    try {
      const filename = await downloadInvoicePDF({
        invoiceNumber,
        order: targetOrder,
        pricing,
        themeId: selectedThemeId,
        customAccent,
        businessDetails: DEFAULT_BUSINESS_DETAILS,
        customDetails,
        customItems,
        customTotals
      });

      // Persist invoice record in StorageEngine
      if (saveInvoice) {
        saveInvoice({
          invoiceNumber,
          orderId: targetOrder.id,
          orderReference: targetOrder.orderReference || targetOrder.id,
          customerId: customer?.id || targetOrder.customerId || customer?.email || 'admin',
          customerEmail: customDetails.email || customer?.email || targetOrder.customerEmail,
          customerName: customDetails.customerName || customer?.name || targetOrder.customerName,
          totalAmount: customTotals.totalAmount,
          taxAmount: customTotals.cgstAmount + customTotals.sgstAmount,
          themeId: selectedThemeId,
          customAccent,
          headerStyle,
          customDetails,
          customItems,
          pdfFilename: filename,
          createdAt: new Date().toISOString()
        });
        loadSavedInvoices();
      }

      setDownloadSuccess(`Invoice ${invoiceNumber} downloaded successfully!`);
      setTimeout(() => setDownloadSuccess(''), 5000);
    } catch (err) {
      console.error('Invoice generation failed:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // WhatsApp Upgrade URL
  const upgradeWhatsAppUrl = useMemo(() => {
    if (!selectedOrder) return '#';
    const text = `Hi FLOCARDS Team, I would like to add the Tax Invoice Add-on (₹199) to my Order ${selectedOrder.orderReference || selectedOrder.id}. Please confirm my payment details.`;
    const phone = BRAND.whatsapp.replace(/[^0-9]/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [selectedOrder]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tab Header Banner */}
      <div
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(107, 0, 255, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%)',
          border: '1px solid rgba(107, 0, 255, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Receipt size={22} color="#6B00FF" />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Tax Invoice Generator
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
            Generate and export official GST-compliant tax invoices for your smart NFC business card orders. Customize visual themes while preserving authoritative billing data.
          </p>
        </div>

        {/* Action Controls: Create Invoice or Load Order */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleStartNewInvoice}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#6B00FF',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(107, 0, 255, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={17} />
            <span>+ Create Invoice</span>
          </button>

          {customerOrders.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--elevated-surface)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                or Load From Order:
              </span>
              <select
                value={isCustomMode ? 'custom' : (selectedOrderId || 'custom')}
                onChange={e => handleSelectOrder(e.target.value)}
                style={{
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="custom">✨ Custom Invoice Mode</option>
                {customerOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    Order {o.orderReference || o.id} (₹{Number(o.totalAmount || o.total_amount || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {!isCustomMode && selectedOrder && !isEligible ? (
        /* Non-Eligible Upgrade Card (with direct link to create custom invoice) */
        <div
          style={{
            padding: '36px 24px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            maxWidth: '680px',
            margin: '0 auto'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <AlertCircle size={28} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Tax Invoice Add-on Not Purchased
          </h3>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
            Order <strong style={{ color: '#6B00FF', fontFamily: 'monospace' }}>{selectedOrder.orderReference || selectedOrder.id}</strong> was placed without the optional <strong>Tax Invoice Add-on (₹199)</strong>. Upgrade to unlock an official GSTIN business tax invoice, input credit certificate, and theme-matched A4 PDF downloads.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              textAlign: 'left',
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'var(--elevated-surface)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} color="#10B981" />
              <span>Full GST Input Credit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Palette size={16} color="#6B00FF" />
              <span>4 Executive PDF Themes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Download size={16} color="#3B82F6" />
              <span>Lifetime PDF Access</span>
            </div>
          </div>

          <a
            href={upgradeWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-md"
            style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', margin: '0 auto' }}
          >
            <MessageCircle size={16} />
            <span>Request Invoice Add-on (₹199) on WhatsApp</span>
          </a>
        </div>
      ) : (
        /* Eligible Customer Invoice Generator Studio */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Left Column: Customization Studio (Items, Details, Theme) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                padding: '20px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Studio Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  backgroundColor: 'var(--elevated-surface)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveControlTab('items')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: activeControlTab === 'items' ? 700 : 500,
                    backgroundColor: activeControlTab === 'items' ? '#6B00FF' : 'transparent',
                    color: activeControlTab === 'items' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Receipt size={14} />
                  <span>Invoice & Items ({customItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveControlTab('details')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: activeControlTab === 'details' ? 700 : 500,
                    backgroundColor: activeControlTab === 'details' ? '#6B00FF' : 'transparent',
                    color: activeControlTab === 'details' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <User size={14} />
                  <span>More Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveControlTab('theme')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: activeControlTab === 'theme' ? 700 : 500,
                    backgroundColor: activeControlTab === 'theme' ? '#6B00FF' : 'transparent',
                    color: activeControlTab === 'theme' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Palette size={14} />
                  <span>Theme & Style</span>
                </button>
              </div>

              {/* TAB 1: INVOICE DETAILS & CUSTOM LINE ITEMS */}
              {activeControlTab === 'items' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Primary Recipient Name & Place of Supply */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(107, 0, 255, 0.05)',
                      border: '1.5px solid rgba(107, 0, 255, 0.22)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#6B00FF' }}>
                        <User size={14} />
                        <span>Invoice Recipient & Place of Supply</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Live synced to A4 preview & PDF
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '3px' }}>
                          Customer / Recipient Name *
                        </label>
                        <input
                          type="text"
                          value={customDetails.customerName || ''}
                          onChange={(e) => setCustomDetails(prev => ({ ...prev, customerName: e.target.value }))}
                          placeholder="e.g. Flocard Admin or Alex Rivera"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border-color, #CBD5E1)',
                            backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                            color: 'var(--text-primary, #0F172A)',
                            fontSize: '0.80rem',
                            fontWeight: 600,
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'text'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '3px' }}>
                          Place of Supply / City *
                        </label>
                        <input
                          type="text"
                          value={customDetails.place || ''}
                          onChange={(e) => setCustomDetails(prev => ({ ...prev, place: e.target.value }))}
                          placeholder="e.g. Indiranagar, Bengaluru or Kochi, Kerala"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border-color, #CBD5E1)',
                            backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                            color: 'var(--text-primary, #0F172A)',
                            fontSize: '0.80rem',
                            fontWeight: 600,
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'text'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Items Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Customize Invoice Items
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Rename items, adjust quantities, unit rates, or add custom deliverables.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={handleResetItems}
                        title="Reset items to order defaults"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 8px',
                          fontSize: '0.72rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--elevated-surface)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#6B00FF',
                          color: '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={13} />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                    {customItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                          border: '1.5px solid var(--border-color, #E2E8F0)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6B00FF', textTransform: 'uppercase' }}>
                            Item #{idx + 1}
                          </span>
                          {customItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="Remove item"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Item Name / Title */}
                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6B00FF', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Edit3 size={11} />
                            <span>Item Name / Description *</span>
                          </label>
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                            placeholder="e.g. FLOCARDS Smart NFC Business Card — PURPLE Edition"
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid var(--border-color, #CBD5E1)',
                              backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                              color: 'var(--text-primary, #0F172A)',
                              fontSize: '0.80rem',
                              fontWeight: 600,
                              outline: 'none',
                              boxSizing: 'border-box',
                              cursor: 'text'
                            }}
                          />
                        </div>

                        {/* Subtitle / Specs */}
                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            Specification / Subtitle
                          </label>
                          <input
                            type="text"
                            value={item.subtitle || ''}
                            onChange={(e) => handleUpdateItem(idx, 'subtitle', e.target.value)}
                            placeholder="e.g. NFC Embedded Matte Polymer Card + Dynamic Live Digital Profile"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid var(--border-color, #E2E8F0)',
                              backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                              color: 'var(--text-primary, #0F172A)',
                              fontSize: '0.74rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              cursor: 'text'
                            }}
                          />
                        </div>

                        {/* Numeric Row: HSN, Qty, Rate, Amount */}
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 70px 1fr 1fr', gap: '8px', alignItems: 'flex-end' }}>
                          <div>
                            <label style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              HSN/SAC
                            </label>
                            <input
                              type="text"
                              value={item.hsn || ''}
                              onChange={(e) => handleUpdateItem(idx, 'hsn', e.target.value)}
                              placeholder="998439"
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1.5px solid var(--border-color, #E2E8F0)',
                                backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                                color: 'var(--text-primary, #0F172A)',
                                fontSize: '0.74rem',
                                boxSizing: 'border-box',
                                cursor: 'text',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.qty ?? ''}
                              onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 6px',
                                borderRadius: '6px',
                                border: '1.5px solid var(--border-color, #CBD5E1)',
                                backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                                color: 'var(--text-primary, #0F172A)',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                boxSizing: 'border-box',
                                textAlign: 'center',
                                cursor: 'text',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                              Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.rate ?? ''}
                              onChange={(e) => handleUpdateItem(idx, 'rate', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1.5px solid var(--border-color, #CBD5E1)',
                                backgroundColor: 'var(--elevated-surface, #FFFFFF)',
                                color: 'var(--text-primary, #0F172A)',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                boxSizing: 'border-box',
                                textAlign: 'right',
                                cursor: 'text',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6B00FF', display: 'block', marginBottom: '2px' }}>
                              Amount (₹)
                            </label>
                            <div
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(107, 0, 255, 0.08)',
                                color: '#6B00FF',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                textAlign: 'right',
                                border: '1px solid rgba(107, 0, 255, 0.25)'
                              }}
                            >
                              ₹{Number(item.amount || ((Number(item.qty) || 0) * (Number(item.rate) || 0))).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Totals Bar */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(107, 0, 255, 0.05)',
                      border: '1px solid rgba(107, 0, 255, 0.15)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Subtotal: <strong>₹{customTotals.taxableBase.toFixed(2)}</strong> + 18% GST (₹{(customTotals.cgstAmount + customTotals.sgstAmount).toFixed(2)})
                    </span>
                    <span style={{ fontWeight: 800, color: '#6B00FF', fontSize: '0.84rem' }}>
                      Total: ₹{customTotals.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: BILLED-TO USER DETAILS */}
              {activeControlTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Customer Billed-To Details
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Update the buyer credentials printed on the official tax invoice.
                    </p>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Customer / Recipient Name *
                    </label>
                    <input
                      type="text"
                      value={customDetails.customerName}
                      onChange={(e) => setCustomDetails({ ...customDetails, customerName: e.target.value })}
                      placeholder="e.g. Alex Rivera"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--elevated-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.80rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Company / Organization Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customDetails.company}
                      onChange={(e) => setCustomDetails({ ...customDetails, company: e.target.value })}
                      placeholder="e.g. Acme Innovations Corp"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--elevated-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.80rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Place of Supply */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Place of Supply / City (GST Jurisdiction)
                    </label>
                    <input
                      type="text"
                      value={customDetails.place || ''}
                      onChange={(e) => setCustomDetails({ ...customDetails, place: e.target.value })}
                      placeholder="e.g. Indiranagar, Bengaluru or Kochi, Kerala"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--elevated-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.80rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Email & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={customDetails.email}
                        onChange={(e) => setCustomDetails({ ...customDetails, email: e.target.value })}
                        placeholder="contact@example.com"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--elevated-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '0.78rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customDetails.phone}
                        onChange={(e) => setCustomDetails({ ...customDetails, phone: e.target.value })}
                        placeholder="+91 98460 12345"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--elevated-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '0.78rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Billing & Delivery Address
                    </label>
                    <textarea
                      rows={2}
                      value={customDetails.shippingAddress}
                      onChange={(e) => setCustomDetails({ ...customDetails, shippingAddress: e.target.value })}
                      placeholder="e.g. 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--elevated-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        resize: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Buyer GSTIN */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Buyer GSTIN (For Business Tax Credit)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={customDetails.gstin}
                      onChange={(e) => setCustomDetails({ ...customDetails, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--elevated-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.80rem',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: THEME & STYLING */}
              {activeControlTab === 'theme' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Visual Theme & Accent
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {INVOICE_THEMES.map(t => {
                      const isSelected = selectedThemeId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedThemeId(t.id);
                            setCustomAccent(t.accentHex);
                          }}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #6B00FF' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'rgba(107, 0, 255, 0.08)' : 'var(--elevated-surface)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: t.accentHex,
                                display: 'inline-block'
                              }}
                            />
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {t.name}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                            {t.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Accent Tint */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Custom Accent Tint
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {['#6B00FF', '#7038F8', '#141419', '#059669', '#2563EB', '#D97706'].map(hex => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCustomAccent(hex)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: hex,
                            border: customAccent === hex ? '3px solid #FFFFFF' : '1px solid rgba(0,0,0,0.2)',
                            boxShadow: customAccent === hex ? '0 0 0 2px #6B00FF' : 'none',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={customAccent}
                        onChange={e => setCustomAccent(e.target.value)}
                        style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      />
                    </div>
                  </div>

                  {/* Header Style Toggle */}
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Header Style
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: 'bold_banner', label: 'Bold Banner' },
                        { id: 'classic', label: 'Classic Corporate' },
                        { id: 'minimal', label: 'Modern Minimal' }
                      ].map(hs => (
                        <button
                          key={hs.id}
                          type="button"
                          onClick={() => setHeaderStyle(hs.id)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: headerStyle === hs.id ? 700 : 500,
                            border: headerStyle === hs.id ? '1px solid #6B00FF' : '1px solid var(--border-color)',
                            backgroundColor: headerStyle === hs.id ? '#6B00FF' : 'var(--elevated-surface)',
                            color: headerStyle === hs.id ? '#FFFFFF' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {hs.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Download Action */}
              <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownloadPDF}
                  className="btn btn-primary btn-md"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                >
                  <Download size={16} />
                  <span>{isDownloading ? 'Generating Print-Ready PDF...' : 'Download A4 Tax Invoice (PDF)'}</span>
                </button>

                {downloadSuccess && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>{downloadSuccess}</span>
                  </div>
                )}

                <p style={{ margin: '8px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  ISO 216 A4 (210×297mm) Vector PDF with valid digital verification seal.
                </p>
              </div>
            </div>

            {/* Previously Generated Invoices Card */}
            {savedInvoices.length > 0 && (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Generated Invoice History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedInvoices.map((inv, idx) => (
                    <div
                      key={inv.id || idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--elevated-surface)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                          {inv.invoiceNumber}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          Order: {inv.orderReference || inv.orderId} • ₹{Number(inv.totalAmount || 0).toFixed(2)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6B00FF',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Download size={12} />
                        <span>PDF</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Printable A4 Invoice Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Live A4 Preview (Print Ready)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Scale: 100% Fit
              </span>
            </div>

            {/* High-fidelity A4 Container */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                color: '#1E1B2E',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                fontSize: '0.8rem',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {/* Header Banner */}
              <div
                style={{
                  backgroundColor: customAccent || activeTheme.primaryColor,
                  color: '#FFFFFF',
                  padding: headerStyle === 'minimal' ? '14px 20px' : '20px 24px',
                  display: 'flex',
                  justifyContent: logoPlacement === 'center' ? 'center' : 'space-between',
                  alignItems: 'center',
                  flexDirection: logoPlacement === 'center' ? 'column' : 'row',
                  gap: '12px',
                  textAlign: logoPlacement === 'center' ? 'center' : 'left'
                }}
              >
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                    FLOCARDS
                  </h1>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>
                    One Tap Every Connection  |  Indiranagar, Bengaluru
                  </div>
                </div>
                <div style={{ textAlign: logoPlacement === 'center' ? 'center' : 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                    TAX INVOICE
                  </div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>
                    Original for Recipient
                  </div>
                </div>
              </div>

              {/* Invoice Meta Bar */}
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#111827' }}>
                    Invoice No: <span style={{ fontFamily: 'monospace', color: customAccent }}>{invoiceNumber}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                    Order Ref: <strong>{effectiveOrder.orderReference || effectiveOrder.id}</strong> • Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: (effectiveOrder.paymentStatus === 'payment_confirmed' || effectiveOrder.payment_status === 'payment_confirmed' || effectiveOrder.paymentStatus === 'paid') ? '#DCFCE7' : '#FEF3C7',
                      color: (effectiveOrder.paymentStatus === 'payment_confirmed' || effectiveOrder.payment_status === 'payment_confirmed' || effectiveOrder.paymentStatus === 'paid') ? '#166534' : '#92400E',
                      border: `1px solid ${(effectiveOrder.paymentStatus === 'payment_confirmed' || effectiveOrder.payment_status === 'payment_confirmed' || effectiveOrder.paymentStatus === 'paid') ? '#86EFAC' : '#FDE68A'}`
                    }}
                  >
                    ● {(effectiveOrder.paymentStatus === 'payment_confirmed' || effectiveOrder.payment_status === 'payment_confirmed' || effectiveOrder.paymentStatus === 'paid') ? 'PAYMENT CONFIRMED' : 'PAYMENT PENDING'}
                  </span>
                </div>
              </div>

              {/* Seller vs Buyer Box */}
              <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: customAccent, textTransform: 'uppercase', marginBottom: '4px' }}>
                    ISSUED BY (SELLER)
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>
                    {DEFAULT_BUSINESS_DETAILS.legalName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4B5563', lineHeight: 1.4, marginTop: '2px' }}>
                    {DEFAULT_BUSINESS_DETAILS.addressLine1}<br />
                    {DEFAULT_BUSINESS_DETAILS.addressLine2}<br />
                    GSTIN: <strong>{DEFAULT_BUSINESS_DETAILS.gstin}</strong> | PAN: {DEFAULT_BUSINESS_DETAILS.pan}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: customAccent, textTransform: 'uppercase', marginBottom: '4px' }}>
                    BILLED TO (CUSTOMER)
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>
                    {customDetails.customerName || effectiveOrder.customerName || 'Customer'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4B5563', lineHeight: 1.4, marginTop: '2px' }}>
                    {customDetails.company && (
                      <div>Company: <strong>{customDetails.company}</strong></div>
                    )}
                    {customDetails.place && (
                      <div>Place of Supply: <strong>{customDetails.place}</strong></div>
                    )}
                    Phone: {customDetails.phone || 'N/A'}<br />
                    Email: {customDetails.email || 'N/A'}<br />
                    Ship To: {customDetails.shippingAddress || 'Standard Delivery'}
                    {customDetails.gstin && (
                      <div style={{ marginTop: '2px' }}>Buyer GSTIN: <strong>{customDetails.gstin}</strong></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table with Custom Items */}
              <div style={{ padding: '16px 24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '8px 10px' }}>Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customItems.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#111827' }}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div style={{ fontSize: '0.68rem', color: '#6B7280' }}>
                              {item.hsn ? `SAC: ${item.hsn} • ` : ''}{item.subtitle}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right' }}>₹{Number(item.rate || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600 }}>₹{Number(item.amount || (Number(item.qty || 1) * Number(item.rate || 0))).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Subtotals & GST Breakdown */}
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                      <span>Taxable Subtotal:</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>₹{customTotals.taxableBase.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                      <span>CGST (9%):</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>₹{customTotals.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                      <span>SGST (9%):</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>₹{customTotals.sgstAmount.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        marginTop: '6px',
                        paddingTop: '6px',
                        borderTop: '2px solid #E5E7EB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: customAccent
                      }}
                    >
                      <span>Total Amount:</span>
                      <span>₹{customTotals.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Seal Footer */}
              <div style={{ padding: '12px 24px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#9CA3AF' }}>
                <div>Computer generated invoice valid under Section 65B of Evidence Act 1872.</div>
                <div style={{ color: customAccent, fontWeight: 700 }}>FLOCARDS DIGITAL SEAL VERIFIED</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
