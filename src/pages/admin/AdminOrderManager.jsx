/* ==========================================================================
   FLOCARD ADMIN ORDER MANAGEMENT & CONTROLLED STATUS UPDATES
   Supports full fulfillment lifecycle stages (Design Submitted to Delivered + Exceptions),
   public update messages, private internal notes, real carrier tracking, and immutable audit history.
   ========================================================================== */

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Calendar,
  X,
  Radio,
  FileText,
  Check,
  Send,
  Eye,
  MessageCircle,
  Globe,
  Plus,
  Phone,
  Upload,
  Image,
  RotateCw,
  Trash2,
  UserCheck,
  Users,
  Receipt,
  CreditCard,
  Edit3,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ORDER_STAGES, EXCEPTION_STAGES, getOrderStageInfo, normalizeOrderStatus, StorageEngine } from '../../lib/storage';
import { EDITIONS } from '../../lib/constants';
import Card3DPreview from '../../components/Card3DPreview';
import CustomerCardPreview from '../../components/CustomerCardPreview';
import OrderPrintDownloadsPanel from '../../components/admin/OrderPrintDownloadsPanel';
import { uploadImage } from '../../lib/uploadImage';
import { queueWhatsAppNotification, getWhatsAppOutbox, retryWhatsAppMessage } from '../../lib/whatsapp';
import WhatsAppContactButton from '../../components/dashboard/WhatsAppContactButton';
import PaymentQrModal from '../../components/dashboard/PaymentQrModal';
import DeleteConfirmNotification from '../../components/dashboard/DeleteConfirmNotification';

export default function AdminOrderManager({ initialOrderId = null }) {
  const { user } = useAuth();
  const themeContext = useTheme();
  // Admin orders manager defaults to dark mode, supports explicit light toggle
  const isDark = themeContext ? themeContext.isDark : true;
  const isLight = !isDark;

  const cardBg = isLight ? '#FFFFFF' : '#110C1D';
  const cardBorder = isLight ? '#EDE6F8' : 'rgba(139, 92, 246, 0.22)';
  const elevatedBg = isLight ? '#F7F3FD' : '#181126';
  const textPrimary = isLight ? '#181126' : '#FFFFFF';
  const textSecondary = isLight ? '#6E6285' : '#BCAED4';
  const textMuted = isLight ? '#988AAE' : '#887B9E';
  const {
    orders = [],
    updateOrderStatus,
    deleteOrder,
    getOrderHistory,
    getOrderInternalNotes,
    addOrderInternalNote,
    saveOrder,
    saveCustomer,
    customers = [],
    updateOrderPaymentStatus,
    setOrderInvoiceEligibility
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'whatsapp' | 'website'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentQrOrder, setPaymentQrOrder] = useState(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);
  const [orderToast, setOrderToast] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [addOrderError, setAddOrderError] = useState('');
  const [addOrderSuccess, setAddOrderSuccess] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

  // Add Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    source: 'whatsapp', // default to WhatsApp per user instruction
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    company: '',
    role: '',
    tagline: '',
    customerLogo: '', // Admin uploaded logo for card
    edition: 'purple',
    templateType: 'standard',
    totalAmount: 1899,
    status: 'design_submitted',
    shippingAddress: '',
    notes: ''
  });

  const handleOpenAddOrderModal = () => {
    setAddOrderError('');
    setAddOrderSuccess('');
    setSelectedCustomerId(null);
    setCustomerSearchQuery('');
    setIsCustomerSearchOpen(false);
    setNewOrderForm({
      source: 'whatsapp',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      company: '',
      role: '',
      tagline: '',
      customerLogo: '',
      edition: 'purple',
      templateType: 'standard',
      totalAmount: EDITIONS.purple?.price || 1899,
      status: 'design_submitted',
      shippingAddress: '',
      notes: ''
    });
    setIsAddOrderModalOpen(true);
  };

  const handleSelectCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setCustomerSearchQuery('');
    setIsCustomerSearchOpen(false);
    setNewOrderForm(prev => ({
      ...prev,
      customerName: c.name || '',
      customerPhone: c.phone || '',
      customerEmail: c.email || '',
      company: c.company || '',
      role: c.role || '',
      customerLogo: c.logoUrl || c.avatar || prev.customerLogo
    }));
  };

  const handleClearCustomerSelection = () => {
    setSelectedCustomerId(null);
    setCustomerSearchQuery('');
    setIsCustomerSearchOpen(false);
    setNewOrderForm(prev => ({
      ...prev,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      company: '',
      role: '',
      customerLogo: ''
    }));
  };

  const [previewSide, setPreviewSide] = useState('front');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const orderLogoInputRef = useRef(null);

  // Logo upload handler for Admin Add Order modal
  const handleOrderLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAddOrderError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const tempPreview = URL.createObjectURL(file);
    setNewOrderForm(prev => ({
      ...prev,
      customerLogo: tempPreview,
      templateType: 'customer_logo'
    }));

    try {
      setIsUploadingLogo(true);
      setAddOrderError('');
      const uploadedUrl = await uploadImage(file, 'logo', `admin_order_${Date.now()}`);
      if (uploadedUrl) {
        setNewOrderForm(prev => ({
          ...prev,
          customerLogo: uploadedUrl,
          templateType: 'customer_logo' // Auto-switch to customer_logo template when logo is uploaded
        }));
      }
    } catch (err) {
      console.error('[AdminOrderManager] Logo upload failed:', err);
      // Even if upload failed, keep preview from base64/objectUrl
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveOrderLogo = () => {
    setNewOrderForm(prev => ({
      ...prev,
      customerLogo: '',
      templateType: 'standard'
    }));
  };

  // Status update form states
  const [targetStatus, setTargetStatus] = useState('');
  const [publicMessage, setPublicMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('');

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Handle creation of new order from admin (WhatsApp vs Website)
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setAddOrderError('');
    setAddOrderSuccess('');

    const clientName = newOrderForm.customerName.trim();
    if (!clientName) {
      setAddOrderError('Customer name is required.');
      return;
    }

    const clientPhone = newOrderForm.customerPhone.trim();
    if (newOrderForm.source === 'whatsapp' && !clientPhone) {
      setAddOrderError('Customer WhatsApp phone number is required for WhatsApp orders.');
      return;
    }

    const clientEmail = newOrderForm.customerEmail.trim();
    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const customerId = selectedCustomerId || (clientEmail ? `cust_${clientEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : `cust_${Date.now()}`);

    // Auto-register customer if not existing
    if (saveCustomer) {
      saveCustomer({
        id: customerId,
        name: clientName,
        email: clientEmail || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@example.com`,
        phone: clientPhone,
        company: newOrderForm.company.trim(),
        role: newOrderForm.role.trim() || 'Client',
        logoUrl: newOrderForm.customerLogo || undefined,
        status: 'active',
        source: newOrderForm.source,
        createdAt: new Date().toISOString()
      });
    }

    const ed = EDITIONS[newOrderForm.edition] || EDITIONS.purple;
    const finalAmount = Number(newOrderForm.totalAmount) || ed.price || 1899;

    // Persist design record so customer & admin can view full artwork
    const designId = `des_${Date.now()}`;
    const logoConfig = newOrderForm.customerLogo ? {
      url: newOrderForm.customerLogo,
      size: 100,
      posX: 0,
      posY: 0,
      showCircleBadge: true
    } : null;

    const flocardLogoConfig = {
      size: 100,
      position: newOrderForm.templateType === 'customer_logo' ? 'bottom-right' : 'top-left'
    };

    const designRecord = {
      id: designId,
      orderId: orderRef,
      customerId,
      customerName: clientName,
      edition: newOrderForm.edition,
      templateType: newOrderForm.templateType,
      front: {
        name: clientName,
        role: newOrderForm.role.trim() || '',
        company: newOrderForm.company.trim() || '',
        tagline: newOrderForm.tagline.trim() || '',
        customLogo: newOrderForm.customerLogo || null,
        fontSize: 'medium',
        alignment: 'left',
        fontFamily: 'Space Grotesk'
      },
      back: {
        qrColor: newOrderForm.edition === 'gold' ? '#D4AF37' : '#FFFFFF',
        qrUrl: `https://flocard.in/p/${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}`
      },
      customColors: {},
      customerLogo: logoConfig,
      flocardLogo: flocardLogoConfig,
      config: {
        front: {
          name: clientName,
          role: newOrderForm.role.trim() || '',
          company: newOrderForm.company.trim() || '',
          tagline: newOrderForm.tagline.trim() || '',
          customLogo: newOrderForm.customerLogo || null
        },
        back: {
          qrColor: newOrderForm.edition === 'gold' ? '#D4AF37' : '#FFFFFF'
        },
        customColors: {},
        customerLogo: logoConfig,
        flocardLogo: flocardLogoConfig
      },
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (StorageEngine?.saveDesign) {
      StorageEngine.saveDesign(designRecord);
    }

    const orderObj = {
      id: orderRef,
      orderReference: orderRef,
      source: newOrderForm.source, // 'whatsapp' | 'website'
      customerId,
      customerName: clientName,
      customerEmail: clientEmail,
      customerPhone: clientPhone,
      clientName,
      clientEmail,
      clientPhone,
      company: newOrderForm.company.trim(),
      role: newOrderForm.role.trim(),
      tagline: newOrderForm.tagline.trim(),
      customerDetails: {
        fullName: clientName,
        email: clientEmail,
        phone: clientPhone,
        company: newOrderForm.company.trim(),
        role: newOrderForm.role.trim() || 'Client',
        address: newOrderForm.shippingAddress.trim()
      },
      hasInvoiceAddon: true,
      invoiceEligible: true,
      customerLogo: logoConfig,
      flocardLogo: flocardLogoConfig,
      designId,
      design: designRecord, // Frozen snapshot of submitted artwork
      frontConfig: designRecord.front,
      backConfig: designRecord.back,
      customColors: {},
      edition: newOrderForm.edition,
      templateType: newOrderForm.templateType,
      totalAmount: finalAmount,
      status: normalizeOrderStatus(newOrderForm.status || 'design_submitted'),
      shippingAddress: newOrderForm.shippingAddress.trim(),
      notes: newOrderForm.notes.trim(),
      approvalNotes: newOrderForm.notes.trim() || `Booked via ${newOrderForm.source === 'whatsapp' ? 'WhatsApp Direct' : 'Website'}`,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Embed printOrder into designRecord so it is redundantly preserved across all accounts & devices
    designRecord.front = {
      ...designRecord.front,
      orderId: orderRef,
      printOrder: { ...orderObj }
    };
    if (StorageEngine?.saveDesign) {
      StorageEngine.saveDesign(designRecord);
    }

    // Ensure customer account is automatically created & synced to profiles across all admin dashboards
    if (saveCustomer && clientName) {
      saveCustomer({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        company: newOrderForm.company.trim(),
        role: 'customer',
        status: 'active'
      }).catch?.(() => {});
    }

    await saveOrder(orderObj);

    // Automatically queue WhatsApp Order Confirmation
    if (orderObj.customerPhone) {
      queueWhatsAppNotification(orderObj, 'order_confirmed').catch(err => {
        console.error('[WhatsApp] Notification queue error:', err);
      });
    }

    // Initial audit log history
    if (StorageEngine?.addOrderStatusHistoryEntry) {
      StorageEngine.addOrderStatusHistoryEntry({
        orderId: orderObj.id,
        previousStatus: null,
        newStatus: orderObj.status,
        publicMessage: `Order booked via ${orderObj.source === 'whatsapp' ? 'WhatsApp Direct' : 'FLOCARD Website'}`,
        actorUserId: user?.id || 'admin',
        actorName: user?.name || 'Flocard Admin'
      });
    }

    if (newOrderForm.notes.trim() && StorageEngine?.addOrderInternalNote) {
      StorageEngine.addOrderInternalNote(orderObj.id, `[Initial Note] ${newOrderForm.notes.trim()}`, user);
    }

    setAddOrderSuccess(`Order ${orderRef} created successfully from ${newOrderForm.source === 'whatsapp' ? 'WhatsApp' : 'Website'}!`);
    setTimeout(() => {
      setIsAddOrderModalOpen(false);
      setAddOrderSuccess('');
      setIsAddOrderModalOpen(false);
      setAddOrderSuccess('');
      setNewOrderForm({
        source: 'whatsapp',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        company: '',
        role: '',
        tagline: '',
        customerLogo: '',
        edition: 'purple',
        templateType: 'standard',
        totalAmount: 1899,
        status: 'design_submitted',
        shippingAddress: '',
        notes: ''
      });
    }, 1000);
  };

  const whatsappOrders = orders.filter(o => o.source === 'whatsapp');
  const websiteOrders = orders.filter(o => o.source !== 'whatsapp');

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      o.id?.toLowerCase().includes(q) ||
      o.orderReference?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.customerPhone?.toLowerCase().includes(q) ||
      o.company?.toLowerCase().includes(q);

    const normStatus = normalizeOrderStatus(o.status);
    const matchesStatus = statusFilter === 'all' || normStatus === statusFilter;

    const matchesSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'whatsapp' && o.source === 'whatsapp') ||
      (sourceFilter === 'website' && o.source !== 'whatsapp');

    return matchesQuery && matchesStatus && matchesSource;
  });

  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState('');
  const [paymentActionSuccess, setPaymentActionSuccess] = useState('');

  const handleOpenUpdateModal = (order) => {
    const currentNorm = normalizeOrderStatus(order.status);
    setSelectedOrder(order);
    setTargetStatus(currentNorm);
    setPublicMessage('');
    setInternalNote('');
    setCarrierName(order.carrierName || '');
    setTrackingNumber(order.trackingNumber || '');
    setTrackingUrl(order.trackingUrl || '');
    setEstimatedDeliveryAt(order.estimatedDeliveryAt ? order.estimatedDeliveryAt.split('T')[0] : '');
    setActionError('');
    setActionSuccess('');
    setPaymentRefInput(order.paymentReference || order.payment_reference || '');
    setPaymentActionError('');
    setPaymentActionSuccess('');
    setIsUpdateModalOpen(true);
  };

  const handleConfirmPayment = async (newStatus) => {
    if (!selectedOrder) return;
    setPaymentActionError('');
    setPaymentActionSuccess('');
    setIsUpdatingPayment(true);
    try {
      if (newStatus === 'payment_confirmed' && !paymentRefInput.trim()) {
        setPaymentActionError('Please provide a payment reference (e.g. UTR, Bank Ref, or UPI transaction ID) for audit verification.');
        setIsUpdatingPayment(false);
        return;
      }
      const refToSave = newStatus === 'payment_confirmed' ? paymentRefInput.trim() : null;
      const updated = await updateOrderPaymentStatus(
        selectedOrder.id,
        newStatus,
        refToSave
      );
      if (updated) {
        setSelectedOrder(prev => ({
          ...prev,
          paymentStatus: newStatus,
          payment_status: newStatus,
          paymentReference: refToSave,
          payment_reference: refToSave
        }));
        setPaymentActionSuccess(
          newStatus === 'payment_confirmed'
            ? 'Payment verified & confirmed! Audit log recorded.'
            : 'Payment status marked as Pending.'
        );
      }
    } catch (err) {
      setPaymentActionError(err.message || 'Failed to update payment status');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleToggleInvoiceEligibility = async (eligible) => {
    if (!selectedOrder) return;
    try {
      const updated = await setOrderInvoiceEligibility(selectedOrder.id, eligible);
      if (updated) {
        setSelectedOrder(prev => ({
          ...prev,
          invoiceEligible: eligible,
          invoice_eligible: eligible,
          hasInvoiceAddon: eligible,
          has_invoice_addon: eligible
        }));
      }
    } catch (err) {
      console.error('Failed to toggle invoice eligibility:', err);
    }
  };

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const match = orders.find(
        (o) => o.id === initialOrderId || o.orderReference === initialOrderId
      );
      if (match) {
        handleOpenUpdateModal(match);
      }
    }
  }, [initialOrderId, orders]);

  const handleDeleteOrder = (order) => {
    setDeleteConfirmOrder(order);
  };

  const executeDeleteOrder = async () => {
    if (!deleteConfirmOrder) return;
    const orderToDelete = deleteConfirmOrder;
    const ref = orderToDelete.orderReference || orderToDelete.id;
    setDeleteConfirmOrder(null);

    try {
      await deleteOrder(orderToDelete.id || ref, user);
      if (selectedOrder?.id === orderToDelete.id || selectedOrder?.orderReference === ref) {
        setSelectedOrder(null);
        setIsUpdateModalOpen(false);
      }
      setOrderToast({
        title: 'Order Deleted',
        message: `Order #${ref} permanently deleted from production queue.`,
        type: 'success'
      });
      setTimeout(() => setOrderToast(null), 4000);
    } catch (err) {
      console.error('Failed to delete order:', err);
      setOrderToast({
        title: 'Delete Failed',
        message: err.message || 'Could not delete order.',
        type: 'error'
      });
      setTimeout(() => setOrderToast(null), 5000);
    }
  };

  const handleStatusChangePrecheck = (e) => {
    e.preventDefault();
    setActionError('');

    if (!targetStatus) {
      setActionError('Please select a valid target status.');
      return;
    }

    // If changing to delivered or cancelled, prompt confirmation
    if (targetStatus === 'delivered' || targetStatus === 'cancelled') {
      setConfirmDialog({
        title: targetStatus === 'delivered' ? 'Confirm Order Delivery' : 'Confirm Order Cancellation',
        message: targetStatus === 'delivered'
          ? `Marking order ${selectedOrder.orderReference || selectedOrder.id} as Delivered will finalize the order and automatically activate the customer's live NFC card and digital profile. Proceed?`
          : `Cancelling order ${selectedOrder.orderReference || selectedOrder.id} will stop manufacturing operations. Proceed?`,
        action: executeStatusUpdate
      });
      return;
    }

    executeStatusUpdate();
  };

  const executeStatusUpdate = () => {
    setIsSubmitting(true);
    setActionError('');
    setConfirmDialog(null);

    try {
      updateOrderStatus({
        orderId: selectedOrder.id,
        newStatus: targetStatus,
        publicMessage: publicMessage.trim(),
        internalNote: internalNote.trim(),
        carrierName: carrierName.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        trackingUrl: trackingUrl.trim() || null,
        estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt).toISOString() : null,
        actorUser: user
      });

      // Automated WhatsApp status notification trigger
      const statusToEventMap = {
        order_confirmed: 'order_confirmed',
        artwork_approved: 'design_approved',
        manufacturing_started: 'manufacturing_started',
        quality_inspection: 'quality_inspection',
        dispatched: 'dispatched',
        delivered: 'delivered',
        revision_required: 'design_approval_requested'
      };
      const eventType = statusToEventMap[targetStatus];
      if (eventType && selectedOrder) {
        queueWhatsAppNotification({
          ...selectedOrder,
          carrierName: carrierName.trim() || selectedOrder.carrierName,
          trackingNumber: trackingNumber.trim() || selectedOrder.trackingNumber,
          trackingUrl: trackingUrl.trim() || selectedOrder.trackingUrl
        }, eventType).catch(err => {
          console.error('[WhatsApp] Failed to queue status transition notification:', err);
        });
      }

      setActionSuccess(`Order status successfully updated to "${getOrderStageInfo(targetStatus).label}".`);
      setTimeout(() => {
        setIsUpdateModalOpen(false);
        setActionSuccess('');
      }, 1200);
    } catch (err) {
      setActionError(err.message || 'Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: '14px'
        }}
      >
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: textSecondary, fontWeight: 500 }}>Total Orders</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>{orders.length}</div>
        </div>

        {/* WhatsApp Channel Orders */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: isLight ? '1px solid #BBF7D0' : '1px solid rgba(34, 197, 94, 0.25)', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MessageCircle size={13} />
            <span>WhatsApp Orders</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>
            {whatsappOrders.length}
          </div>
        </div>

        {/* Website Channel Orders */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: isLight ? '1px solid #DDD6FE' : '1px solid rgba(112, 56, 248, 0.25)', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#7038f8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={13} />
            <span>Website Orders</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7038f8', marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>
            {websiteOrders.length}
          </div>
        </div>

        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#D97706', fontWeight: 500 }}>In Production</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>
            {orders.filter(o => ['design_submitted', 'artwork_approved', 'manufacturing_started', 'quality_inspection'].includes(normalizeOrderStatus(o.status))).length}
          </div>
        </div>

        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 500 }}>Delivered & Live</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>
            {orders.filter(o => normalizeOrderStatus(o.status) === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{
          padding: 'clamp(14px, 3vw, 24px)',
          backgroundColor: cardBg,
          borderRadius: '16px',
          border: `1px solid ${cardBorder}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Controls: Search, + Add Order Button & Filter Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
          {/* Top Row: Search Input & Add Order Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px', maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textSecondary, pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reference, customer, phone..."
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: searchQuery ? '32px' : '12px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  fontSize: '0.84rem',
                  borderRadius: '10px',
                  border: `1px solid ${cardBorder}`,
                  backgroundColor: elevatedBg,
                  color: textPrimary,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: textSecondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Add Order Button */}
            <button
              type="button"
              onClick={handleOpenAddOrderModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(112, 56, 248, 0.35)',
                transition: 'all 0.16s ease',
                flexShrink: 0
              }}
            >
              <Plus size={16} />
              <span>Add Order (WhatsApp / Web)</span>
            </button>
          </div>

          {/* Unified Filter Card Container */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              backgroundColor: elevatedBg,
              border: `1px solid ${cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Filter Header & Channel Segmented Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Channel:
                </span>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.4)',
                    padding: '3px',
                    borderRadius: '9999px',
                    border: `1px solid ${cardBorder}`,
                    maxWidth: '100%',
                    overflowX: 'auto'
                  }}
                >
                  {[
                    { key: 'all', label: `All (${orders.length})` },
                    { key: 'whatsapp', label: `WhatsApp (${whatsappOrders.length})`, icon: MessageCircle, color: '#16a34a' },
                    { key: 'website', label: `Website (${websiteOrders.length})`, icon: Globe, color: '#7038f8' }
                  ].map((src) => {
                    const isActive = sourceFilter === src.key;
                    const Icon = src.icon;
                    return (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() => setSourceFilter(src.key)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          border: 'none',
                          backgroundColor: isActive ? (src.color ? `${src.color}` : '#7038f8') : 'transparent',
                          color: isActive ? '#FFFFFF' : textSecondary,
                          fontSize: '0.74rem',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.16s ease',
                          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {Icon && <Icon size={12} />}
                        <span>{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset active filters button if any filter is active */}
              {(statusFilter !== 'all' || sourceFilter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSourceFilter('all');
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${cardBorder}`,
                    backgroundColor: 'transparent',
                    color: textMuted,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCw size={11} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Stage Selector Bar: Unified Segmented Track */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', color: textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Stage:
                </span>
                <span style={{ fontSize: '0.72rem', color: textSecondary }}>
                  Showing {filteredOrders.length} of {orders.length}
                </span>
              </div>

              {/* Smooth Horizontal Segmented Pill Track with Touch Momentum */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  paddingTop: '2px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {[
                  { key: 'all', label: 'All Stages' },
                  { key: 'new_order', label: 'New Request' },
                  { key: 'reviewing', label: 'In Review' },
                  { key: 'approved', label: 'Approved' },
                  { key: 'manufacturing', label: 'Manufacturing' },
                  { key: 'quality_check', label: 'Quality Check' },
                  { key: 'dispatched', label: 'Dispatched' },
                  { key: 'delivered', label: 'Completed' }
                ].map((st) => {
                  const isActive = statusFilter === st.key;
                  const count = st.key === 'all'
                    ? orders.length
                    : orders.filter(o => normalizeOrderStatus(o.status) === st.key).length;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setStatusFilter(st.key)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isActive ? '1px solid #8B5CF6' : `1px solid ${cardBorder}`,
                        backgroundColor: isActive ? '#7C3AED' : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)'),
                        color: isActive ? '#FFFFFF' : textSecondary,
                        fontSize: '0.74rem',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxShadow: isActive ? '0 2px 10px rgba(124, 58, 237, 0.35)' : 'none',
                        transition: 'all 0.16s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{st.label}</span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)',
                          color: isActive ? '#FFFFFF' : textMuted,
                          fontWeight: 700
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table — Desktop View */}
        <div className="admin-desktop-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}`, color: textSecondary, fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 14px' }}>Order Ref & Channel</th>
                <th style={{ padding: '14px 14px' }}>Customer & Contact</th>
                <th style={{ padding: '14px 14px' }}>Card Edition</th>
                <th style={{ padding: '14px 14px' }}>Payment</th>
                <th style={{ padding: '14px 14px' }}>Invoice</th>
                <th style={{ padding: '14px 14px' }}>Stage</th>
                <th style={{ padding: '14px 14px' }}>Tracking</th>
                <th style={{ padding: '14px 14px', textAlign: 'right', minWidth: '270px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: textSecondary }}>
                    <Package size={36} color={cardBorder} style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
                      {orders.length === 0 ? 'No manufacturing orders in queue' : 'No orders matching filter'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: textMuted }}>
                      {orders.length === 0 ? 'Add an order from WhatsApp or Website using "+ Add Order" above.' : 'Try adjusting your search query, channel, or stage filter.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const normStatus = normalizeOrderStatus(order.status);
                  const stageInfo = getOrderStageInfo(normStatus);
                  const ed = EDITIONS[order.edition] || EDITIONS.purple;
                  const isPaid = order.paymentStatus === 'payment_confirmed' || order.payment_status === 'payment_confirmed' || order.paymentStatus === 'paid' || normStatus === 'payment_confirmed';
                  const hasInvoice = order.hasInvoiceAddon || order.has_invoice_addon || order.invoiceEligible || order.invoice_eligible;

                  const stageStyles = {
                    new_order: { bg: 'rgba(96, 165, 250, 0.16)', text: '#60A5FA', border: 'rgba(96, 165, 250, 0.35)' },
                    reviewing: { bg: 'rgba(129, 140, 248, 0.16)', text: '#818CF8', border: 'rgba(129, 140, 248, 0.35)' },
                    approved: { bg: 'rgba(6, 182, 212, 0.16)', text: '#06B6D4', border: 'rgba(6, 182, 212, 0.35)' },
                    manufacturing: { bg: 'rgba(249, 115, 22, 0.16)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.35)' },
                    quality_check: { bg: isLight ? '#F5EEFF' : 'rgba(168, 85, 247, 0.16)', text: isLight ? '#6D28D9' : '#C084FC', border: isLight ? '#DDD6FE' : 'rgba(168, 85, 247, 0.35)' },
                    dispatched: { bg: isLight ? '#EFF6FF' : 'rgba(56, 189, 248, 0.16)', text: isLight ? '#1D4ED8' : '#38BDF8', border: isLight ? '#BFDBFE' : 'rgba(56, 189, 248, 0.35)' },
                    delivered: { bg: isLight ? '#DCFCE7' : 'rgba(16, 185, 129, 0.16)', text: isLight ? '#15803D' : '#34D399', border: isLight ? '#86EFAC' : 'rgba(16, 185, 129, 0.35)' },
                    cancelled: { bg: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.16)', text: isLight ? '#B91C1C' : '#F87171', border: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)' }
                  };
                  const stStyle = stageStyles[normStatus] || stageStyles.new_order;

                  return (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${cardBorder}`, transition: 'background-color 0.15s ease' }}>
                      {/* Order Reference & Channel Source */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: isLight ? '#6D28D9' : '#C084FC', fontSize: '0.84rem' }}>
                            {order.orderReference || order.id}
                          </span>
                          {order.source === 'whatsapp' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.15)',
                                color: isLight ? '#15803D' : '#4ADE80',
                                border: `1px solid ${isLight ? '#86EFAC' : 'rgba(34, 197, 94, 0.35)'}`,
                                fontSize: '0.68rem',
                                fontWeight: 700
                              }}
                              title="Customer ordered via WhatsApp direct chat"
                            >
                              <MessageCircle size={10} />
                              <span>WhatsApp</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: isLight ? '#F3EEFF' : 'rgba(139, 92, 246, 0.15)',
                                color: isLight ? '#7C3AED' : '#C084FC',
                                border: `1px solid ${isLight ? '#DDD6FE' : 'rgba(139, 92, 246, 0.35)'}`,
                                fontSize: '0.68rem',
                                fontWeight: 700
                              }}
                              title="Customer submitted on FLOCARD website"
                            >
                              <Globe size={10} />
                              <span>Website</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '3px' }}>
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer & Contact Details */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: textPrimary, fontSize: '0.86rem' }}>
                          {order.customerName || order.design?.front?.name || order.frontConfig?.name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '2px' }}>{order.customerEmail}</div>
                        {order.customerPhone && (
                          <div style={{ fontSize: '0.72rem', color: isLight ? '#15803D' : '#4ADE80', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', fontWeight: 600 }}>
                            <Phone size={10} />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                        {order.company && <div style={{ fontSize: '0.7rem', color: '#A855F7', fontWeight: 700, marginTop: '2px' }}>{order.company}</div>}
                      </td>

                      {/* Card Edition */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            backgroundColor: `${ed.accentColor}18`,
                            color: ed.accentColor,
                            border: `1px solid ${ed.accentColor}35`,
                            textTransform: 'capitalize',
                            display: 'inline-block'
                          }}
                        >
                          {ed.name}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '4px' }}>
                          {order.templateType === 'customer_logo' ? 'With Customer Logo' : 'Standard Format'}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            backgroundColor: isPaid ? (isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.15)') : (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)'),
                            color: isPaid ? (isLight ? '#15803D' : '#4ADE80') : (isLight ? '#B45309' : '#FBBF24'),
                            border: `1px solid ${isPaid ? (isLight ? '#86EFAC' : 'rgba(34, 197, 94, 0.35)') : (isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.35)')}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ● {isPaid ? 'Paid' : 'Payment Pending'}
                        </span>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: textPrimary, marginTop: '3px' }}>
                          ₹{Number(order.totalAmount || order.total_amount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Invoice Add-On Status */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        {hasInvoice ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: isLight ? '#F3EEFF' : 'rgba(139, 92, 246, 0.16)',
                              color: isLight ? '#7C3AED' : '#C084FC',
                              border: `1px solid ${isLight ? '#DDD6FE' : 'rgba(139, 92, 246, 0.35)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Receipt size={11} />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: textMuted }}>—</span>
                        )}
                      </td>

                      {/* Fulfillment Stage */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            backgroundColor: stStyle.bg,
                            color: stStyle.text,
                            border: `1px solid ${stStyle.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: stStyle.text }} />
                          <span>{stageInfo.label}</span>
                        </span>
                      </td>

                      {/* Carrier / Tracking */}
                      <td style={{ padding: '14px 14px', verticalAlign: 'middle' }}>
                        {order.trackingNumber ? (
                          <div>
                            <div style={{ fontSize: '0.76rem', color: '#60A5FA', fontWeight: 700, fontFamily: 'monospace' }}>
                              {order.trackingNumber}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: textMuted }}>
                              {order.carrierName || 'Courier'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: textMuted, fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions Toolbar (Unified Inline Action Group) */}
                      <td style={{ padding: '14px 14px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <WhatsAppContactButton
                            customerOrOrder={order}
                            size="sm"
                            onOpenPaymentQr={(ord) => setPaymentQrOrder(ord)}
                          />
                          <button
                            type="button"
                            onClick={() => setPaymentQrOrder(order)}
                            title={`View ₹${Number(order.totalAmount || order.total_amount || 2000).toLocaleString('en-IN')} Dynamic UPI Payment QR Code`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              backgroundColor: isLight ? 'rgba(107, 0, 255, 0.08)' : 'rgba(107, 0, 255, 0.2)',
                              border: '1px solid rgba(107, 0, 255, 0.35)',
                              color: isLight ? '#6B00FF' : '#C084FC',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = isLight ? 'rgba(107, 0, 255, 0.18)' : 'rgba(107, 0, 255, 0.32)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = isLight ? 'rgba(107, 0, 255, 0.08)' : 'rgba(107, 0, 255, 0.2)';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <QrCode size={12} />
                            <span>Payment QR</span>
                          </button>
                          <a
                            href={`/admin?tab=studio&orderId=${order.id || order.orderReference}`}
                            title="Edit Card Design in Admin Studio"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              backgroundColor: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(139, 92, 246, 0.16)',
                              border: `1px solid ${isLight ? 'rgba(124, 58, 237, 0.25)' : 'rgba(139, 92, 246, 0.35)'}`,
                              color: isLight ? '#7C3AED' : '#C084FC',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = isLight ? 'rgba(124, 58, 237, 0.18)' : 'rgba(139, 92, 246, 0.28)';
                              e.currentTarget.style.color = isLight ? '#6D28D9' : '#FFFFFF';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(139, 92, 246, 0.16)';
                              e.currentTarget.style.color = isLight ? '#7C3AED' : '#C084FC';
                            }}
                          >
                            <Edit3 size={12} />
                            <span>Edit Design</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(order)}
                            title="Update Fulfillment Stage & Tracking"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#7C3AED',
                              border: '1px solid #8B5CF6',
                              color: '#FFFFFF',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#6D28D9';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#7C3AED';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <Sliders size={12} />
                            <span>Update Status</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            title="Delete Order Permanently"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '5px 8px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#EF4444',
                              cursor: 'pointer',
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Orders Mobile Card View (Zero Horizontal Scrolling) */}
        <div className="admin-mobile-cards" style={{ display: 'none', padding: '12px', flexDirection: 'column', gap: '10px' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: textSecondary }}>
              <Package size={36} color={cardBorder} style={{ margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
                {orders.length === 0 ? 'No manufacturing orders in queue' : 'No orders matching filter'}
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const normStatus = normalizeOrderStatus(order.status);
              const stageInfo = getOrderStageInfo(normStatus);
              const ed = EDITIONS[order.edition] || EDITIONS.purple;

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#6B00FF', fontSize: '0.9rem' }}>
                          {order.orderReference || order.id}
                        </span>
                        {order.source === 'whatsapp' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.15)',
                              color: '#16a34a',
                              border: `1px solid ${isLight ? '#86EFAC' : 'rgba(34, 197, 94, 0.3)'}`,
                              fontSize: '0.64rem',
                              fontWeight: 700
                            }}
                          >
                            <MessageCircle size={9} />
                            <span>WhatsApp</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: isLight ? '#F3EEFF' : 'rgba(112, 56, 248, 0.15)',
                              color: '#7038f8',
                              border: `1px solid ${isLight ? '#DDD6FE' : 'rgba(112, 56, 248, 0.3)'}`,
                              fontSize: '0.64rem',
                              fontWeight: 700
                            }}
                          >
                            <Globe size={9} />
                            <span>Website</span>
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: textPrimary, fontSize: '0.92rem', marginTop: '2px' }}>
                        {order.customerName}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: stageInfo.bgColor,
                        color: stageInfo.color,
                        border: `1px solid ${stageInfo.color}40`,
                        flexShrink: 0
                      }}
                    >
                      ● {stageInfo.label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', padding: '8px 10px', borderRadius: '8px', backgroundColor: elevatedBg }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Phone / Contact</div>
                      <div style={{ fontSize: '0.76rem', color: textPrimary, fontWeight: 600, marginTop: '2px' }}>
                        {order.customerPhone ? (
                          <a href={`tel:${order.customerPhone}`} style={{ color: '#6B00FF', textDecoration: 'none' }}>
                            {order.customerPhone}
                          </a>
                        ) : (
                          order.customerEmail || '—'
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Card Edition</div>
                      <div style={{ fontSize: '0.76rem', color: textPrimary, fontWeight: 700, marginTop: '2px', textTransform: 'capitalize' }}>
                        {ed.name || order.edition || 'Purple'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Payment</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: (order.paymentStatus === 'payment_confirmed' || order.payment_status === 'payment_confirmed') ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                        {(order.paymentStatus === 'payment_confirmed' || order.payment_status === 'payment_confirmed') ? '● Confirmed' : '● Pending'} (₹{Number(order.totalAmount || order.total_amount || 0).toLocaleString('en-IN')})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Invoice Add-On</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: (order.hasInvoiceAddon || order.has_invoice_addon || order.invoiceEligible || order.invoice_eligible) ? '#6B00FF' : textMuted, marginTop: '2px' }}>
                        {(order.hasInvoiceAddon || order.has_invoice_addon || order.invoiceEligible || order.invoice_eligible) ? '✓ Included' : 'Not Included'}
                      </div>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', backgroundColor: isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.1)' }}>
                      Tracking: {order.trackingNumber} ({order.carrierName || 'Courier'})
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <a
                      href={`/admin/studio?orderId=${order.id || order.orderReference}`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', gap: '6px' }}
                    >
                      <Edit3 size={13} />
                      <span>Edit Design</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenUpdateModal(order)}
                      style={{
                        flex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Sliders size={14} />
                      <span>Update Order Stage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order)}
                      title="Delete Order"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#EF4444',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CONTROLLED STATUS UPDATE MODAL */}
      {isUpdateModalOpen && selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: cardBg,
              borderRadius: '20px',
              border: `1px solid ${cardBorder}`,
              padding: '28px',
              boxShadow: isLight ? '0 20px 45px rgba(76, 29, 149, 0.12)' : '0 20px 50px rgba(0, 0, 0, 0.6)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: textPrimary, fontWeight: 700 }}>
                  Update Order Journey: {selectedOrder.orderReference || selectedOrder.id}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: textSecondary }}>
                    Customer: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerEmail})
                  </p>
                  <WhatsAppContactButton
                    customerOrOrder={selectedOrder}
                    size="sm"
                    onOpenPaymentQr={(ord) => setPaymentQrOrder(ord)}
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentQrOrder(selectedOrder)}
                    title="View & Scan Dynamic UPI Payment QR Code"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#EDE9FE' : 'rgba(107, 0, 255, 0.22)',
                      border: '1px solid rgba(107, 0, 255, 0.35)',
                      color: isLight ? '#6B00FF' : '#C084FC',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <QrCode size={13} />
                    <span>Payment QR</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Customer Designed Card Preview */}
            <div style={{ marginBottom: '16px' }}>
              <CustomerCardPreview order={selectedOrder} isLight={isLight} />
            </div>

            {/* Authoritative Print-Ready Artwork & Transparent Logo Downloads */}
            <OrderPrintDownloadsPanel order={selectedOrder} isLight={isLight} isAdmin={true} />

            {/* Order Financials & Shipping Details */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: elevatedBg, border: `1px solid ${cardBorder}`, marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: textSecondary }}>
                  Order Financials & Delivery
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentQrOrder(selectedOrder)}
                    title="Open Dynamic Payment QR with exact amount"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: isLight ? 'rgba(107, 0, 255, 0.08)' : 'rgba(107, 0, 255, 0.2)',
                      border: '1px solid rgba(107, 0, 255, 0.35)',
                      color: isLight ? '#6B00FF' : '#C084FC',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <QrCode size={12} />
                    <span>View Payment QR</span>
                  </button>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#6B00FF' }}>
                    Total: ₹{Number(selectedOrder.totalAmount || selectedOrder.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '8px', fontSize: '0.78rem', color: textSecondary }}>
                <div>
                  <span style={{ color: textMuted }}>Quantity: </span>
                  <strong style={{ color: textPrimary }}>{selectedOrder.quantity || 1} unit(s)</strong>
                </div>
                <div>
                  <span style={{ color: textMuted }}>Shipping To: </span>
                  <strong style={{ color: textPrimary }}>{selectedOrder.shippingAddress || selectedOrder.shipping_address || 'Standard Delivery'}</strong>
                </div>
                {selectedOrder.billingDetails?.gstin && (
                  <div>
                    <span style={{ color: textMuted }}>GSTIN: </span>
                    <strong style={{ color: textPrimary, fontFamily: 'monospace' }}>{selectedOrder.billingDetails.gstin}</strong>
                  </div>
                )}
                {selectedOrder.billingDetails?.company && (
                  <div>
                    <span style={{ color: textMuted }}>Billing Entity: </span>
                    <strong style={{ color: textPrimary }}>{selectedOrder.billingDetails.company}</strong>
                  </div>
                )}
              </div>

              {selectedOrder.pricingBreakdown && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${cardBorder}`, display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.74rem', color: textMuted }}>
                  <span>Base: ₹{selectedOrder.pricingBreakdown.basePrice}</span>
                  {selectedOrder.pricingBreakdown.customizationCharge > 0 && <span>Customization: +₹{selectedOrder.pricingBreakdown.customizationCharge}</span>}
                  <span>Delivery: {selectedOrder.pricingBreakdown.deliveryCharge > 0 ? `+₹${selectedOrder.pricingBreakdown.deliveryCharge}` : 'FREE'}</span>
                  {selectedOrder.pricingBreakdown.invoiceAddonCharge > 0 && <span>Invoice Add-on: +₹{selectedOrder.pricingBreakdown.invoiceAddonCharge}</span>}
                  <span>GST (18%): +₹{selectedOrder.pricingBreakdown.taxAmount}</span>
                </div>
              )}
            </div>

            {/* Authorized Payment Verification Section */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: (selectedOrder.paymentStatus === 'payment_confirmed' || selectedOrder.payment_status === 'payment_confirmed') ? (isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.08)') : (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.08)'), border: `1px solid ${(selectedOrder.paymentStatus === 'payment_confirmed' || selectedOrder.payment_status === 'payment_confirmed') ? (isLight ? '#BBF7D0' : 'rgba(34, 197, 94, 0.25)') : (isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.25)')}`, marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={15} color={(selectedOrder.paymentStatus === 'payment_confirmed' || selectedOrder.payment_status === 'payment_confirmed') ? '#16A34A' : '#D97706'} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: (selectedOrder.paymentStatus === 'payment_confirmed' || selectedOrder.payment_status === 'payment_confirmed') ? '#16A34A' : '#D97706' }}>
                    Payment Verification (Independent Bank Audit)
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: (selectedOrder.paymentStatus === 'payment_confirmed' || selectedOrder.payment_status === 'payment_confirmed') ? '#16A34A' : '#D97706', color: '#FFFFFF' }}>
                  {(selectedOrder.paymentStatus === 'payment_confirmed' || selectedOrder.payment_status === 'payment_confirmed') ? 'PAID / CONFIRMED' : 'PAYMENT PENDING'}
                </span>
              </div>

              {(selectedOrder.paymentStatus === 'payment_confirmed' || selectedOrder.payment_status === 'payment_confirmed') ? (
                <div>
                  <div style={{ fontSize: '0.76rem', color: textSecondary, marginBottom: '8px' }}>
                    Reference: <strong style={{ fontFamily: 'monospace', color: textPrimary }}>{selectedOrder.paymentReference || selectedOrder.payment_reference || 'MANUAL-ADMIN-VERIFIED'}</strong>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdatingPayment}
                    onClick={() => handleConfirmPayment('payment_pending')}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textMuted, cursor: 'pointer' }}
                  >
                    Revert to Payment Pending
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '0.73rem', color: textMuted }}>
                    Verify bank account or UPI credit before marking confirmed. Never infer payment from WhatsApp click-to-chat.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={paymentRefInput}
                      onChange={e => setPaymentRefInput(e.target.value)}
                      placeholder="Bank UTR / UPI Ref / Transaction ID"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, backgroundColor: cardBg, color: textPrimary }}
                    />
                    <button
                      type="button"
                      disabled={isUpdatingPayment}
                      onClick={() => handleConfirmPayment('payment_confirmed')}
                      style={{ fontSize: '0.75rem', fontWeight: 700, padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#16A34A', color: '#FFFFFF', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {isUpdatingPayment ? 'Verifying...' : 'Mark Payment Confirmed'}
                    </button>
                  </div>
                </div>
              )}

              {paymentActionError && (
                <div style={{ marginTop: '8px', fontSize: '0.73rem', color: '#EF4444' }}>
                  {paymentActionError}
                </div>
              )}
              {paymentActionSuccess && (
                <div style={{ marginTop: '8px', fontSize: '0.73rem', color: '#10B981' }}>
                  {paymentActionSuccess}
                </div>
              )}
            </div>

            {/* Invoice Add-On Management Section */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: elevatedBg, border: `1px solid ${cardBorder}`, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} color="#6B00FF" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>
                    Customer Tax Invoice Add-on
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '2px' }}>
                  {(selectedOrder.hasInvoiceAddon || selectedOrder.has_invoice_addon || selectedOrder.invoiceEligible || selectedOrder.invoice_eligible)
                    ? 'Customer is eligible to generate theme-matched tax invoices in dashboard.'
                    : 'Customer did not purchase the ₹199 invoice add-on.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleInvoiceEligibility(!(selectedOrder.hasInvoiceAddon || selectedOrder.has_invoice_addon || selectedOrder.invoiceEligible || selectedOrder.invoice_eligible))}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #6B00FF',
                  backgroundColor: (selectedOrder.hasInvoiceAddon || selectedOrder.has_invoice_addon || selectedOrder.invoiceEligible || selectedOrder.invoice_eligible) ? 'rgba(107, 0, 255, 0.1)' : '#6B00FF',
                  color: (selectedOrder.hasInvoiceAddon || selectedOrder.has_invoice_addon || selectedOrder.invoiceEligible || selectedOrder.invoice_eligible) ? '#6B00FF' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                {(selectedOrder.hasInvoiceAddon || selectedOrder.has_invoice_addon || selectedOrder.invoiceEligible || selectedOrder.invoice_eligible) ? 'Revoke Access' : 'Grant Access'}
              </button>
            </div>

            <form onSubmit={handleStatusChangePrecheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Stage */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '6px' }}>
                  Fulfillment Stage
                </label>
                <select
                  value={targetStatus}
                  onChange={e => setTargetStatus(e.target.value)}
                  style={{ width: '100%', fontSize: '0.86rem', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary }}
                >
                  <optgroup label="Standard Sequential Pipeline">
                    {ORDER_STAGES.map(s => (
                      <option key={s.key} value={s.key}>
                        Step {s.step}: {s.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Exception & Correction States">
                    {EXCEPTION_STAGES.map(s => (
                      <option key={s.key} value={s.key}>
                        ⚠️ {s.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Customer-Facing Public Update Message */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '6px' }}>
                  Customer-Facing Update Message (Visible in customer timeline & in-app notification)
                </label>
                <textarea
                  rows={2}
                  value={publicMessage}
                  onChange={e => setPublicMessage(e.target.value)}
                  placeholder="Optional custom message explaining this stage to the client..."
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '10px 12px' }}
                />
              </div>

              {/* Private Administrative Internal Note (Protected - Never Exposed to Customers) */}
              <div style={{ backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.05)', padding: '14px', borderRadius: '10px', border: `1px solid ${isLight ? '#FECACA' : 'rgba(239, 68, 68, 0.2)'}` }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Lock size={13} />
                  <span>Private Internal Administrative Note (ADMIN ONLY — Never sent to customer)</span>
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  placeholder="e.g. Quality inspection passed on batch #882. Courier waybill printed."
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical', backgroundColor: cardBg, borderRadius: '8px', border: `1px solid ${cardBorder}`, color: textPrimary, padding: '8px 10px' }}
                />
              </div>

              {/* Carrier Tracking Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Courier / Carrier Name
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={e => setCarrierName(e.target.value)}
                    placeholder="e.g. BlueDart / DHL / FedEx"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Tracking / Waybill Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BD98712345"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Tracking URL
                  </label>
                  <input
                    type="text"
                    value={trackingUrl}
                    onChange={e => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDeliveryAt}
                    onChange={e => setEstimatedDeliveryAt(e.target.value)}
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
              </div>

              {actionError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '0.82rem' }}>
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.82rem' }}>
                  {actionSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${cardBorder}`,
                    backgroundColor: elevatedBg,
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
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Save Status Transition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR CRITICAL ACTIONS */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: cardBg,
              borderRadius: '16px',
              border: `1px solid ${cardBorder}`,
              padding: '24px',
              textAlign: 'center',
              boxShadow: isLight ? '0 20px 45px rgba(76, 29, 149, 0.12)' : '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <AlertTriangle size={36} color="#F59E0B" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: textPrimary }}>
              {confirmDialog.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: textSecondary, lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  backgroundColor: elevatedBg,
                  color: textPrimary,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={confirmDialog.action}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
              >
                Yes, Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE NEW ORDER MODAL (WhatsApp vs Website Channel + Live 3D Card Preview & Logo Upload) */}
      {isAddOrderModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              maxWidth: '1060px',
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              backgroundColor: cardBg,
              borderRadius: '24px',
              border: `1px solid ${cardBorder}`,
              padding: '24px 28px',
              boxShadow: isLight ? '0 25px 60px rgba(76, 29, 149, 0.16)' : '0 25px 70px rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${cardBorder}`, paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: newOrderForm.source === 'whatsapp' ? '#22c55e' : '#7038f8', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {newOrderForm.source === 'whatsapp' ? 'WhatsApp Direct' : 'FLOCARD Website'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: textPrimary, fontWeight: 700 }}>
                    Create New Card Order
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: textSecondary }}>
                  Record a client order, preview card finish in real time, customize role & tagline, and upload custom logo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOrderModalOpen(false)}
                style={{
                  background: elevatedBg,
                  border: `1px solid ${cardBorder}`,
                  color: textSecondary,
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {addOrderError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{addOrderError}</span>
              </div>
            )}

            {addOrderSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#16a34a', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{addOrderSuccess}</span>
              </div>
            )}

            {/* Two-Column Grid: Form Left, Real-Time Card Preview Right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '24px', alignItems: 'start' }}>
              {/* LEFT COLUMN: Order Details & Controls */}
              <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Channel Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
                    Order Channel / Source *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setNewOrderForm({ ...newOrderForm, source: 'whatsapp' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: newOrderForm.source === 'whatsapp' ? '2px solid #22c55e' : `1px solid ${cardBorder}`,
                        background: newOrderForm.source === 'whatsapp' ? (isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.15)') : elevatedBg,
                        color: newOrderForm.source === 'whatsapp' ? '#16a34a' : textSecondary,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <MessageCircle size={15} />
                      <span>WhatsApp Direct</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewOrderForm({ ...newOrderForm, source: 'website' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: newOrderForm.source === 'website' ? '2px solid #7038f8' : `1px solid ${cardBorder}`,
                        background: newOrderForm.source === 'website' ? (isLight ? '#F5F3FF' : 'rgba(112, 56, 248, 0.15)') : elevatedBg,
                        color: newOrderForm.source === 'website' ? '#7038f8' : textSecondary,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Globe size={15} />
                      <span>FLOCARD Website</span>
                    </button>
                  </div>
                </div>

                {/* Card Edition Selector (Visual Buttons with Prices) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary }}>
                      Select Card Edition & Finish *
                    </label>
                    <span style={{ fontSize: '0.72rem', color: textMuted }}>Live Canvas Updated</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 86px), 1fr))', gap: '8px' }}>
                    {[
                      { key: 'purple', name: 'Purple', price: 1899, color: '#7038f8', border: '#905cfc' },
                      { key: 'gold', name: 'Gold', price: 2499, color: '#D4AF37', border: '#F5D061' },
                      { key: 'platinum', name: 'Platinum', price: 2199, color: '#94A3B8', border: '#CBD5E1' },
                      { key: 'metal', name: 'Metal', price: 2999, color: '#475569', border: '#64748B' },
                      { key: 'white', name: 'White', price: 1899, color: '#FFFFFF', border: '#E2E8F0' }
                    ].map(ed => {
                      const isSelected = newOrderForm.edition === ed.key;
                      return (
                        <button
                          key={ed.key}
                          type="button"
                          onClick={() => setNewOrderForm({ ...newOrderForm, edition: ed.key, totalAmount: ed.price })}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '10px',
                            border: isSelected ? `2px solid ${ed.border}` : `1px solid ${cardBorder}`,
                            background: isSelected ? (isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(255, 255, 255, 0.06)') : elevatedBg,
                            color: textPrimary,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: isSelected ? `0 0 12px ${ed.color}33` : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: ed.color, border: ed.key === 'white' ? '1px solid #CBD5E1' : 'none', boxShadow: isSelected ? `0 0 10px ${ed.color}` : 'none' }} />
                          <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>{ed.name}</span>
                          <span style={{ fontSize: '0.68rem', color: isSelected ? ed.border : textMuted }}>₹{ed.price.toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Logo Upload & Management */}
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: elevatedBg, border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Image size={14} color="#7038f8" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>
                        Customer Logo for Card
                      </span>
                    </div>
                    {newOrderForm.customerLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveOrderLogo}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>

                  {newOrderForm.customerLogo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: isDark ? '#000' : '#fff', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px' }}>
                        <img src={newOrderForm.customerLogo} alt="Customer logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: textPrimary, fontWeight: 600 }}>Custom Logo Attached</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: textSecondary }}>Will render directly on the physical NFC card face.</p>
                      </div>
                      <input
                        ref={orderLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleOrderLogoUpload}
                        style={{ display: 'none' }}
                        disabled={isUploadingLogo}
                      />
                      <button
                        type="button"
                        onClick={() => orderLogoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: isDark ? 'rgba(255,255,255,0.08)' : '#E9E4F0', color: textPrimary, fontSize: '0.72rem', fontWeight: 600, cursor: isUploadingLogo ? 'wait' : 'pointer' }}
                      >
                        {isUploadingLogo ? 'Uploading...' : 'Change'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={orderLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleOrderLogoUpload}
                        style={{ display: 'none' }}
                        disabled={isUploadingLogo}
                      />
                      <button
                        type="button"
                        onClick={() => orderLogoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '12px',
                          borderRadius: '8px',
                          border: `1px dashed ${cardBorder}`,
                          background: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF',
                          cursor: isUploadingLogo ? 'wait' : 'pointer',
                          color: textSecondary,
                          fontSize: '0.76rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Upload size={14} color="#7038f8" />
                        <span>{isUploadingLogo ? 'Uploading logo to storage...' : 'Click to Upload Customer Logo (PNG, JPG, SVG)'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Explicit Existing Customer Search & Selection */}
                <div style={{ padding: '12px', borderRadius: '10px', background: isLight ? '#F9F8FC' : 'rgba(255,255,255,0.03)', border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: textPrimary }}>
                      <Users size={14} color="#7038F8" />
                      <span>Existing Customer Lookup (Optional)</span>
                    </div>
                    {selectedCustomerId && (
                      <button
                        type="button"
                        onClick={handleClearCustomerSelection}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Clear / Reset Details
                      </button>
                    )}
                  </div>

                  {selectedCustomerId ? (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isLight ? '#F5F3FF' : 'rgba(112, 56, 248, 0.15)',
                      border: '1px solid #7038F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={16} color="#7038F8" />
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>{newOrderForm.customerName}</div>
                          <div style={{ fontSize: '0.7rem', color: textSecondary }}>{newOrderForm.customerPhone || newOrderForm.customerEmail || 'Saved Customer'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedCustomerId(null); setIsCustomerSearchOpen(true); }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #7038F8',
                          background: 'transparent',
                          color: '#7038F8',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
                          <input
                            type="text"
                            autoComplete="off"
                            placeholder="Search existing customers by name, phone, or email..."
                            value={customerSearchQuery}
                            onFocus={() => setIsCustomerSearchOpen(true)}
                            onChange={(e) => {
                              setCustomerSearchQuery(e.target.value);
                              setIsCustomerSearchOpen(true);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 30px',
                              borderRadius: '8px',
                              border: `1px solid ${cardBorder}`,
                              background: elevatedBg,
                              color: textPrimary,
                              fontSize: '0.78rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        {isCustomerSearchOpen && (
                          <button
                            type="button"
                            onClick={() => setIsCustomerSearchOpen(false)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: `1px solid ${cardBorder}`,
                              background: elevatedBg,
                              color: textSecondary,
                              fontSize: '0.74rem',
                              cursor: 'pointer'
                            }}
                          >
                            Close
                          </button>
                        )}
                      </div>

                      {/* Dropdown Results */}
                      {isCustomerSearchOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            backgroundColor: elevatedBg,
                            border: `1px solid ${cardBorder}`,
                            borderRadius: '8px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            zIndex: 50
                          }}
                        >
                          {customers.filter(c => {
                            if (!customerSearchQuery.trim()) return true;
                            const q = customerSearchQuery.toLowerCase();
                            return (
                              (c.name && c.name.toLowerCase().includes(q)) ||
                              (c.phone && c.phone.includes(q)) ||
                              (c.email && c.email.toLowerCase().includes(q)) ||
                              (c.company && c.company.toLowerCase().includes(q))
                            );
                          }).length === 0 ? (
                            <div style={{ padding: '10px', fontSize: '0.76rem', color: textSecondary, textAlign: 'center' }}>
                              No matching existing customers found.
                            </div>
                          ) : (
                            customers.filter(c => {
                              if (!customerSearchQuery.trim()) return true;
                              const q = customerSearchQuery.toLowerCase();
                              return (
                                (c.name && c.name.toLowerCase().includes(q)) ||
                                (c.phone && c.phone.includes(q)) ||
                                (c.email && c.email.toLowerCase().includes(q)) ||
                                (c.company && c.company.toLowerCase().includes(q))
                              );
                            }).slice(0, 8).map(c => (
                              <div
                                key={c.id || c.email}
                                onClick={() => handleSelectCustomer(c)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: `1px solid ${cardBorder}`,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'background 0.1s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLight ? '#F3EEFF' : 'rgba(112, 56, 248, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: textPrimary }}>{c.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: textSecondary }}>{c.phone || c.email} {c.company ? `• ${c.company}` : ''}</div>
                                </div>
                                <span style={{ fontSize: '0.68rem', color: '#7038F8', fontWeight: 600 }}>Select</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Identity Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="e.g. Rahul Sharma"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      WhatsApp / Phone {newOrderForm.source === 'whatsapp' ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="+91 98765 43210"
                      value={newOrderForm.customerPhone}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Role & Company */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Designation / Role on Card
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CEO & Founder"
                      value={newOrderForm.role}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, role: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Company Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Innovations"
                      value={newOrderForm.company}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, company: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Email & Front Tagline */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="rahul@company.com"
                      value={newOrderForm.customerEmail}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Front Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="Card tagline (optional)"
                      value={newOrderForm.tagline}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, tagline: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Price, Design Style & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Price (₹ INR)
                    </label>
                    <input
                      type="number"
                      value={newOrderForm.totalAmount}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, totalAmount: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Design Style
                    </label>
                    <select
                      value={newOrderForm.templateType}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, templateType: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="standard">Standard FLOCARD</option>
                      <option value="customer_logo">Customer Logo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Fulfillment Status
                    </label>
                    <select
                      value={newOrderForm.status}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, status: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="design_submitted">Design Submitted</option>
                      <option value="artwork_approved">Artwork Approved</option>
                      <option value="manufacturing_started">Manufacturing</option>
                      <option value="quality_inspection">Inspection</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                    Order Notes / WhatsApp Summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Client confirmed on WhatsApp. Requested glossy finish on gold metallic card."
                    value={newOrderForm.notes}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Submit / Cancel Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddOrderModalOpen(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textSecondary, fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '11px',
                      borderRadius: '10px',
                      background: newOrderForm.source === 'whatsapp' ? '#22c55e' : 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      boxShadow: newOrderForm.source === 'whatsapp' ? '0 4px 15px rgba(34, 197, 94, 0.4)' : '0 4px 15px rgba(112, 56, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Check size={16} />
                    <span>Save {newOrderForm.source === 'whatsapp' ? 'WhatsApp' : 'Website'} Order</span>
                  </button>
                </div>
              </form>

              {/* RIGHT COLUMN: Interactive 3D Card Preview with Live Customer Details & Logo */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: elevatedBg,
                  borderRadius: '16px',
                  border: `1px solid ${cardBorder}`,
                  padding: '20px',
                  gap: '16px'
                }}
              >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={15} color="#7038f8" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: textPrimary }}>
                      Live 3D Card Preview
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewSide(prev => prev === 'front' ? 'back' : 'front')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${cardBorder}`,
                      background: cardBg,
                      color: textPrimary,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCw size={12} />
                    <span>Flip to {previewSide === 'front' ? 'Back (QR Code)' : 'Front'}</span>
                  </button>
                </div>

                {/* 3D Card Canvas */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: '260px', alignItems: 'center' }}>
                  <Card3DPreview
                    edition={newOrderForm.edition}
                    templateType={newOrderForm.customerLogo ? 'customer_logo' : newOrderForm.templateType}
                    width={410}
                    side={previewSide}
                    onSideChange={setPreviewSide}
                    config={{
                      front: {
                        name: newOrderForm.customerName.trim() || 'YOUR NAME',
                        role: newOrderForm.role.trim() || 'CEO & Founder',
                        company: newOrderForm.company.trim() || 'FLOCARD Enterprise',
                        tagline: newOrderForm.tagline.trim(),
                        customLogo: newOrderForm.customerLogo || null
                      },
                      back: {
                        qrColor: newOrderForm.edition === 'gold' ? '#D4AF37' : '#FFFFFF'
                      },
                      customerLogo: {
                        url: newOrderForm.customerLogo || null,
                        size: 40,
                        showCircleBadge: true
                      }
                    }}
                  />
                </div>

                {/* Live Card Specifications Info Strip */}
                <div style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: cardBg, border: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: textMuted, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Card Spec</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: textPrimary, textTransform: 'capitalize' }}>
                      {newOrderForm.edition} Edition NFC
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: textMuted, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Artwork</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: newOrderForm.customerLogo ? '#22c55e' : '#7038f8' }}>
                      {newOrderForm.customerLogo ? 'Custom Logo' : 'Standard FLOCARD'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', color: textMuted, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Price</span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#22c55e' }}>
                      ₹{Number(newOrderForm.totalAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Payment QR Code Modal (Pre-fills ₹ Amount & Google Pay Deep Link) */}
      <PaymentQrModal
        isOpen={Boolean(paymentQrOrder)}
        order={paymentQrOrder}
        onClose={() => setPaymentQrOrder(null)}
        isLight={isLight}
      />

      {/* Apple-Style In-App Delete Confirmation Notification with OK Button */}
      <DeleteConfirmNotification
        isOpen={Boolean(deleteConfirmOrder)}
        title="Delete Card Order"
        itemName={deleteConfirmOrder ? `Order #${deleteConfirmOrder.orderReference || deleteConfirmOrder.id}` : ''}
        message="Are you sure you want to permanently delete this order? All related customer artwork proofs and invoices will also be removed."
        onConfirm={executeDeleteOrder}
        onCancel={() => setDeleteConfirmOrder(null)}
        confirmLabel="OK"
        isLight={isLight}
      />

      {/* Floating Side Toast Notification for Order Actions */}
      {orderToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999999,
            maxWidth: '380px',
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: orderToast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideInRight 0.25s ease-out',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          <Check size={18} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{orderToast.title}</div>
            <div style={{ opacity: 0.92, fontSize: '0.78rem' }}>{orderToast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
