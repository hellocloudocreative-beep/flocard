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
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ORDER_STAGES, EXCEPTION_STAGES, getOrderStageInfo, normalizeOrderStatus, StorageEngine } from '../../lib/storage';
import { EDITIONS } from '../../lib/constants';
import Card3DPreview from '../../components/Card3DPreview';
import { uploadImage } from '../../lib/uploadImage';

export default function AdminOrderManager({ initialOrderId = null }) {
  const { user } = useAuth();
  const themeContext = useTheme();
  // Admin orders manager ALWAYS uses obsidian dark theme
  const isLight = false;
  const isDark = true;

  const cardBg = isLight ? '#FFFFFF' : '#100B19';
  const cardBorder = isLight ? '#E8E3EF' : '#2A1D3B';
  const elevatedBg = isLight ? '#F7F6FA' : '#171022';
  const textPrimary = isLight ? '#191522' : '#FFFFFF';
  const textSecondary = isLight ? '#777184' : '#B8AEC8';
  const textMuted = isLight ? '#9CA3AF' : '#7C728E';
  const {
    orders = [],
    updateOrderStatus,
    getOrderHistory,
    getOrderInternalNotes,
    addOrderInternalNote,
    saveOrder,
    saveCustomer,
    customers = []
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'whatsapp' | 'website'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [addOrderError, setAddOrderError] = useState('');
  const [addOrderSuccess, setAddOrderSuccess] = useState('');

  // Add Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    source: 'whatsapp', // default to WhatsApp per user instruction
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    company: '',
    role: '',
    tagline: 'One Tap Every Connection',
    customerLogo: '', // Admin uploaded logo for card
    edition: 'purple',
    templateType: 'standard',
    totalAmount: 1899,
    status: 'design_submitted',
    shippingAddress: '',
    notes: ''
  });

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
      setAddOrderError('Failed to upload logo. Please try another image.');
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
  const handleCreateOrder = (e) => {
    e.preventDefault();
    setAddOrderError('');
    setAddOrderSuccess('');

    if (!newOrderForm.customerName.trim()) {
      setAddOrderError('Customer name is required.');
      return;
    }

    const orderRef = `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const clientName = newOrderForm.customerName.trim();
    const clientEmail = newOrderForm.customerEmail.trim() || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@example.com`;
    const clientPhone = newOrderForm.customerPhone.trim() || '+91 97782 78552';
    const customerId = `cust_${Date.now()}`;

    // Auto-register customer if not existing
    if (saveCustomer) {
      saveCustomer({
        id: customerId,
        name: clientName,
        email: clientEmail,
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
    if (StorageEngine?.saveDesign) {
      StorageEngine.saveDesign({
        id: designId,
        orderId: orderRef,
        customerId,
        customerName: clientName,
        edition: newOrderForm.edition,
        templateType: newOrderForm.templateType,
        config: {
          front: {
            name: clientName,
            role: newOrderForm.role.trim() || 'Executive',
            company: newOrderForm.company.trim() || 'FLOCARD Enterprise',
            tagline: newOrderForm.tagline.trim() || 'One Tap Every Connection',
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
        },
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const orderObj = {
      id: orderRef,
      orderReference: orderRef,
      source: newOrderForm.source, // 'whatsapp' | 'website'
      customerId,
      customerName: clientName,
      customerEmail: clientEmail,
      customerPhone: clientPhone,
      company: newOrderForm.company.trim(),
      role: newOrderForm.role.trim() || 'Executive',
      tagline: newOrderForm.tagline.trim() || 'One Tap Every Connection',
      customerLogo: newOrderForm.customerLogo || null,
      designId,
      edition: newOrderForm.edition,
      templateType: newOrderForm.templateType,
      totalAmount: finalAmount,
      status: normalizeOrderStatus(newOrderForm.status || 'design_submitted'),
      shippingAddress: newOrderForm.shippingAddress.trim() || 'Standard Delivery',
      notes: newOrderForm.notes.trim(),
      approvalNotes: newOrderForm.notes.trim() || `Booked via ${newOrderForm.source === 'whatsapp' ? 'WhatsApp Direct' : 'Website'}`,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveOrder(orderObj);

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
      setNewOrderForm({
        source: 'whatsapp',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        company: '',
        role: '',
        tagline: 'One Tap Every Connection',
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
    setIsUpdateModalOpen(true);
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
          padding: '24px',
          backgroundColor: cardBg,
          borderRadius: '16px',
          border: `1px solid ${cardBorder}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}
      >
        {/* Controls: Search, + Add Order Button & Filter Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {/* Search Input & + Add Order Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search reference, customer, phone..."
                  style={{
                    width: '100%',
                    paddingLeft: '34px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: `1px solid ${cardBorder}`,
                    backgroundColor: elevatedBg,
                    color: textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Add Order Button */}
              <button
                type="button"
                onClick={() => setIsAddOrderModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7038f8 0%, #905cfc 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(112, 56, 248, 0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Plus size={15} />
                <span>Add Order (WhatsApp / Web)</span>
              </button>
            </div>

            {/* Source Channel Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: textMuted, fontWeight: 600, marginRight: '4px' }}>Channel:</span>
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
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: isActive ? `1px solid ${src.color || '#6B00FF'}` : `1px solid ${cardBorder}`,
                      backgroundColor: isActive ? (src.color ? `${src.color}15` : '#6B00FF15') : elevatedBg,
                      color: isActive ? (src.color || '#6B00FF') : textSecondary,
                      fontSize: '0.74rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {Icon && <Icon size={12} />}
                    <span>{src.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: textMuted, fontWeight: 600, marginRight: '4px' }}>Stage:</span>
            {['all', 'design_submitted', 'artwork_approved', 'manufacturing_started', 'quality_inspection', 'dispatched', 'delivered'].map((st) => {
              const isActive = statusFilter === st;
              const count = st === 'all' ? orders.length : orders.filter(o => normalizeOrderStatus(o.status) === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid #6B00FF' : `1px solid ${cardBorder}`,
                    backgroundColor: isActive ? '#6B00FF' : elevatedBg,
                    color: isActive ? '#FFFFFF' : textSecondary,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    boxShadow: isActive ? '0 2px 8px rgba(107, 0, 255, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st === 'all' ? `All Stages (${count})` : `${getOrderStageInfo(st).label} (${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table — Desktop View */}
        <div className="admin-desktop-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}`, color: textSecondary, fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                <th style={{ padding: '12px 14px' }}>Order Ref & Channel</th>
                <th style={{ padding: '12px 14px' }}>Customer & Contact</th>
                <th style={{ padding: '12px 14px' }}>Card Edition</th>
                <th style={{ padding: '12px 14px' }}>Fulfillment Stage</th>
                <th style={{ padding: '12px 14px' }}>Carrier / Tracking</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: textSecondary }}>
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
                  const isDelivered = normStatus === 'delivered';
                  const isException = EXCEPTION_STAGES.some(s => s.key === normStatus);
                  const ed = EDITIONS[order.edition] || EDITIONS.purple;

                  return (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      {/* Order Reference & Channel Source */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6B00FF' }}>
                            {order.orderReference || order.id}
                          </span>
                          {order.source === 'whatsapp' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '9999px',
                                backgroundColor: isLight ? '#DCFCE7' : 'rgba(34, 197, 94, 0.15)',
                                color: '#16a34a',
                                border: `1px solid ${isLight ? '#86EFAC' : 'rgba(34, 197, 94, 0.3)'}`,
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
                                padding: '2px 7px',
                                borderRadius: '9999px',
                                backgroundColor: isLight ? '#F3EEFF' : 'rgba(112, 56, 248, 0.15)',
                                color: '#7038f8',
                                border: `1px solid ${isLight ? '#DDD6FE' : 'rgba(112, 56, 248, 0.3)'}`,
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
                        <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '3px' }}>
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer & Contact Details */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: textPrimary }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: textSecondary }}>{order.customerEmail}</div>
                        {order.customerPhone && (
                          <div style={{ fontSize: '0.7rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', fontWeight: 500 }}>
                            <Phone size={10} />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                        {order.company && <div style={{ fontSize: '0.7rem', color: '#6B00FF', fontWeight: 600, marginTop: '2px' }}>{order.company}</div>}
                      </td>

                      {/* Card Edition */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: `${ed.accentColor}18`,
                            color: ed.accentColor,
                            border: `1px solid ${ed.accentColor}33`,
                            textTransform: 'capitalize'
                          }}
                        >
                          {ed.name}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '4px' }}>
                          {order.templateType === 'customer_logo' ? 'With Customer Logo' : 'Standard Format'}
                        </div>
                      </td>

                      {/* Fulfillment Stage */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: isDelivered ? (isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)') : isException ? (isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#F3EEFF' : 'rgba(107, 0, 255, 0.15)'),
                            color: isDelivered ? '#059669' : isException ? '#DC2626' : '#6B00FF',
                            border: `1px solid ${isDelivered ? (isLight ? '#A7F3D0' : 'rgba(16, 185, 129, 0.3)') : isException ? (isLight ? '#FECACA' : 'rgba(239, 68, 68, 0.3)') : (isLight ? '#DDD6FE' : 'rgba(107, 0, 255, 0.3)')}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ● {stageInfo.label}
                        </span>
                      </td>

                      {/* Carrier / Tracking */}
                      <td style={{ padding: '12px 14px' }}>
                        {order.trackingNumber ? (
                          <div>
                            <div style={{ fontSize: '0.76rem', color: '#2563EB', fontWeight: 600 }}>
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

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(order)}
                            className="btn btn-primary btn-xs"
                            style={{ gap: '4px' }}
                          >
                            <Sliders size={12} />
                            <span>Update Status</span>
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
                  </div>

                  {order.trackingNumber && (
                    <div style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', backgroundColor: isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.1)' }}>
                      Tracking: {order.trackingNumber} ({order.carrierName || 'Courier'})
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenUpdateModal(order)}
                    style={{
                      width: '100%',
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
            zIndex: 1000,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: textPrimary, fontWeight: 700 }}>
                  Update Order Journey: {selectedOrder.orderReference || selectedOrder.id}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: textSecondary }}>
                  Customer: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer' }}
              >
                <X size={20} />
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { key: 'purple', name: 'Purple', price: 1899, color: '#7038f8', border: '#905cfc' },
                      { key: 'gold', name: 'Gold', price: 2499, color: '#D4AF37', border: '#F5D061' },
                      { key: 'platinum', name: 'Platinum', price: 2199, color: '#94A3B8', border: '#CBD5E1' },
                      { key: 'metal', name: 'Metal', price: 2999, color: '#475569', border: '#64748B' }
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
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: ed.color, boxShadow: isSelected ? `0 0 10px ${ed.color}` : 'none' }} />
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

                {/* Customer Identity Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: elevatedBg, color: textPrimary, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>
                      WhatsApp / Phone *
                    </label>
                    <input
                      type="text"
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
                      placeholder="One Tap Every Connection"
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
                        tagline: newOrderForm.tagline.trim() || 'One Tap Every Connection',
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
    </div>
  );
}
