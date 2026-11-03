/* ==========================================================================
   FLOCARDS — ORDER SUMMARY & PRINT REQUEST MODAL
   Replaces payment gateway with a transparent pre-production order review,
   trusted server-side pricing, delivery verification, invoice add-on selection,
   and direct WhatsApp production queue integration.
   ========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Package,
  Truck,
  FileText,
  ShieldCheck,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Receipt,
  Layers,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Copy,
  Check
} from 'lucide-react';
import { EDITIONS, TEMPLATES } from '../../lib/constants';
import { calculateOrderPricing, getInvoiceConfig } from '../../lib/orderPricing';
import { getPrintOrderWhatsAppUrl } from '../../lib/whatsapp';
import CardCanvas from '../CardCanvas';

export default function OrderSummaryPrintModal({
  isOpen,
  onClose,
  design,
  edition = 'purple',
  templateType = 'standard',
  user = null,
  frontConfig = {},
  backConfig = {},
  customColors = {},
  customerLogo = null,
  flocardLogo = null,
  onSubmitOrder,
  isLight = false
}) {
  const invoiceConfig = getInvoiceConfig();

  // Form states
  const [quantity, setQuantity] = useState(1);
  const [hasInvoiceAddon, setHasInvoiceAddon] = useState(false);
  const [customerName, setCustomerName] = useState(user?.name || frontConfig?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [company, setCompany] = useState(user?.company || frontConfig?.company || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryCity, setDeliveryCity] = useState(user?.city || '');
  const [deliveryState, setDeliveryState] = useState(user?.state || '');
  const [deliveryPincode, setDeliveryPincode] = useState(user?.pincode || '');

  // Billing Details (for Invoice)
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
  const [billingCompany, setBillingCompany] = useState(company);
  const [billingGstin, setBillingGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // UI & Submission state
  const [activeSide, setActiveSide] = useState('front');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Authoritative server-side pricing calculation
  const pricing = useMemo(() => {
    return calculateOrderPricing({
      edition,
      quantity,
      hasInvoiceAddon,
      customizationFee: 0,
      deliveryFee: 0,
      discountAmount: 0
    });
  }, [edition, quantity, hasInvoiceAddon]);

  const editionDetails = EDITIONS[edition] || EDITIONS.purple;
  const templateDetails = TEMPLATES[templateType] || TEMPLATES.standard;

  if (!isOpen) return null;

  // Handle Order Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = customerName.trim();
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const trimmedEmail = customerEmail.trim();
    const fullShipping = `${deliveryAddress.trim()}${deliveryCity ? `, ${deliveryCity.trim()}` : ''}${deliveryState ? `, ${deliveryState.trim()}` : ''}${deliveryPincode ? ` - ${deliveryPincode.trim()}` : ''}`;

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name for recipient delivery.');
      return;
    }
    // Phone number is optional: only validate length if user enters one
    if (customerPhone.trim() && cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits) or leave it empty.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for digital updates and invoices.');
      return;
    }
    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      setErrorMessage('Please provide a complete delivery street address for courier dispatch.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        design: {
          ...(design || {}),
          id: design?.id || `des_${Date.now()}`,
          edition,
          templateType,
          title: design?.title || `${trimmedName}'s ${editionDetails.name}`,
          front: frontConfig,
          back: backConfig,
          customColors,
          customerLogo,
          flocardLogo,
          company: company.trim()
        },
        customerDetails: {
          name: trimmedName,
          phone: customerPhone.trim(),
          email: trimmedEmail,
          company: company.trim(),
          shippingAddress: fullShipping
        },
        billingDetails: {
          company: billingCompany.trim() || company.trim(),
          gstin: billingGstin.trim(),
          address: billingSameAsDelivery ? fullShipping : billingAddress.trim()
        },
        hasInvoiceAddon,
        quantity,
        customerUser: user,
        source: 'web_studio'
      };

      const created = await onSubmitOrder(orderPayload);
      setSubmittedOrder(created);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit card request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderRef = (ref) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const combinedConfig = {
    ...frontConfig,
    ...backConfig,
    customColors,
    customerLogo,
    flocardLogo
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 3, 10, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#100B1A',
          border: isLight ? '1px solid rgba(112, 56, 248, 0.25)' : '1px solid rgba(168, 85, 247, 0.28)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: submittedOrder ? '540px' : '960px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(107, 0, 255, 0.15)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: isLight ? '1px solid rgba(112, 56, 248, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLight ? '#F9F8FD' : '#140D22'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(107, 0, 255, 0.15)',
                color: 'var(--accent-purple, #A855F7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-purple, #A855F7)', fontWeight: 700 }}>
                FLOCARDS STUDIO CHECKOUT
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#191522' : '#FFFFFF', margin: 0 }}>
                {submittedOrder ? 'Print Order Confirmation' : 'Order Summary & Print Request'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? '#64748B' : '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {submittedOrder ? (
            /* =================================================================
               SUCCESS SCREEN (Order Reference + WhatsApp Routing Confirmation)
               ================================================================= */
            <div style={{ textAlign: 'center', padding: '8px 12px 16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '2px solid #22C55E',
                  color: '#22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: isLight ? '#191522' : '#FFFFFF', marginBottom: '8px' }}>
                Card Request Submitted Successfully!
              </h3>

              <p style={{ fontSize: '0.86rem', color: isLight ? '#64748B' : '#94A3B8', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Your custom NFC card design and details have been saved to your account. Our team has received your request and will review it shortly.
              </p>

              {/* Order Reference Box */}
              <div
                style={{
                  backgroundColor: isLight ? '#F1EEF8' : 'rgba(107, 0, 79, 0.12)',
                  border: isLight ? '1px solid #E8D5E5' : '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Request Reference Code
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#6B004F' }}>
                    {submittedOrder.orderReference || submittedOrder.id}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyOrderRef(submittedOrder.orderReference || submittedOrder.id)}
                  className="btn btn-outline btn-xs"
                  style={{ gap: '6px' }}
                >
                  {copiedRef ? <Check size={13} color="#22C55E" /> : <Copy size={13} />}
                  <span>{copiedRef ? 'Copied' : 'Copy Ref'}</span>
                </button>
              </div>

              {/* Order Quick Specs */}
              <div
                style={{
                  backgroundColor: isLight ? '#F8FAFC' : '#161024',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Customer:</span>
                  <strong style={{ color: isLight ? '#191522' : '#FFFFFF' }}>{submittedOrder.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Product:</span>
                  <strong style={{ color: isLight ? '#191522' : '#FFFFFF' }}>{submittedOrder.productName || `${submittedOrder.edition} Edition NFC Card`}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Quantity:</span>
                  <strong style={{ color: isLight ? '#191522' : '#FFFFFF' }}>{submittedOrder.quantity} Unit(s)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Status:</span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#3B82F6'
                    }}
                  >
                    ● New Request (In Review)
                  </span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href="/dashboard/orders"
                  className="btn btn-primary btn-lg"
                  style={{
                    backgroundColor: '#6B004F',
                    borderColor: '#6B004F',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    gap: '8px',
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                >
                  <span>Track Request in Dashboard</span>
                  <ChevronRight size={18} />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : (
            /* =================================================================
               ORDER SUMMARY & PRINT REQUEST FORM
               ================================================================= */
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
                  gap: '24px'
                }}
              >
                {/* Left Column: Visual Card Preview & Specs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Card Artwork Preview Header */}
                  <div
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : '#150E23',
                      border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 700, color: isLight ? '#64748B' : '#94A3B8' }}>
                        Artwork Proof (Exact Design)
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveSide('front')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: 'none',
                            backgroundColor: activeSide === 'front' ? 'var(--accent-purple, #A855F7)' : 'transparent',
                            color: activeSide === 'front' ? '#FFFFFF' : (isLight ? '#64748B' : '#94A3B8'),
                            cursor: 'pointer'
                          }}
                        >
                          Front
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSide('back')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: 'none',
                            backgroundColor: activeSide === 'back' ? 'var(--accent-purple, #A855F7)' : 'transparent',
                            color: activeSide === 'back' ? '#FFFFFF' : (isLight ? '#64748B' : '#94A3B8'),
                            cursor: 'pointer'
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </div>

                    {/* Live Card Canvas Render */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '340px',
                        aspectRatio: '85.6 / 54',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <CardCanvas
                        side={activeSide}
                        templateType={templateType}
                        edition={edition}
                        config={combinedConfig}
                      />
                    </div>

                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isLight ? '#191522' : '#FFFFFF' }}>
                        {editionDetails.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: isLight ? '#64748B' : '#94A3B8' }}>
                        {templateDetails.name} • High-Frequency NFC Chip
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '0.7rem', color: (customerLogo?.url || frontConfig?.customLogo) ? '#10B981' : (isLight ? '#64748B' : '#94A3B8') }}>
                        {(customerLogo?.url || frontConfig?.customLogo) ? '✓ Custom Logo Attached' : '✓ Typographic Design (No Logo Required)'}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : '#150E23',
                      border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '18px'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: isLight ? '#64748B' : '#94A3B8', marginBottom: '14px' }}>
                      Authoritative Price Breakdown
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>
                          Unit Price ({editionDetails.name}):
                        </span>
                        <strong style={{ color: isLight ? '#191522' : '#FFFFFF' }}>₹{pricing.unitPrice}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Quantity:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.15)',
                              background: 'transparent',
                              color: isLight ? '#191522' : '#FFFFFF',
                              cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                              fontWeight: 700
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 800, minWidth: '24px', textAlign: 'center', color: isLight ? '#191522' : '#FFFFFF' }}>
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(q => q + 1)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.15)',
                              background: 'transparent',
                              color: isLight ? '#191522' : '#FFFFFF',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>NFC Encoding & Laser Finish:</span>
                        <span style={{ color: '#22C55E', fontWeight: 600 }}>Included (₹0)</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>Express Pan-India Delivery:</span>
                        <span style={{ color: '#22C55E', fontWeight: 600 }}>Free (₹0)</span>
                      </div>

                      {hasInvoiceAddon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple, #A855F7)' }}>
                          <span>Official Tax Invoice Generator:</span>
                          <strong>+₹{pricing.invoiceAddonFee}</strong>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: isLight ? '#94A3B8' : '#64748B', paddingTop: '4px' }}>
                        <span>Applicable GST (18% included):</span>
                        <span>₹{pricing.totalTax} (CGST: ₹{pricing.cgstAmount} + SGST: ₹{pricing.sgstAmount})</span>
                      </div>

                      <div
                        style={{
                          borderTop: isLight ? '1.5px solid #E2E8F0' : '1.5px solid rgba(255, 255, 255, 0.1)',
                          paddingTop: '10px',
                          marginTop: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline'
                        }}
                      >
                        <span style={{ fontSize: '0.96rem', fontWeight: 700, color: isLight ? '#191522' : '#FFFFFF' }}>
                          Total Payable:
                        </span>
                        <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-purple, #A855F7)' }}>
                          ₹{pricing.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Customer Info & Invoice Add-on Option */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Delivery & Customer Details */}
                  <div
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : '#150E23',
                      border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: isLight ? '#64748B' : '#94A3B8' }}>
                      Delivery & Contact Details
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                          Phone / WhatsApp (Optional)
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder="+91 98765 43210 (Optional)"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={e => setCustomerEmail(e.target.value)}
                          placeholder="alex@flocard.in"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                        Company / Organization (Optional)
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        placeholder="e.g. FLOCARDS Smart Systems"
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                        Courier Delivery Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Flat / Office No, Building Name, Street"
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                          City
                        </label>
                        <input
                          type="text"
                          value={deliveryCity}
                          onChange={e => setDeliveryCity(e.target.value)}
                          placeholder="Bengaluru"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                          State
                        </label>
                        <input
                          type="text"
                          value={deliveryState}
                          onChange={e => setDeliveryState(e.target.value)}
                          placeholder="Karnataka"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '4px' }}>
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={deliveryPincode}
                          onChange={e => setDeliveryPincode(e.target.value)}
                          placeholder="560038"
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Add-on Option */}
                  <div
                    style={{
                      backgroundColor: hasInvoiceAddon
                        ? (isLight ? '#F1EEF8' : 'rgba(107, 0, 255, 0.12)')
                        : (isLight ? '#F8FAFC' : '#150E23'),
                      border: hasInvoiceAddon
                        ? '1.5px solid var(--accent-purple, #A855F7)'
                        : (isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)'),
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={hasInvoiceAddon}
                        onChange={e => setHasInvoiceAddon(e.target.checked)}
                        style={{ marginTop: '3px', accentColor: 'var(--accent-purple, #A855F7)', width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isLight ? '#191522' : '#FFFFFF' }}>
                            Add Official Business Tax Invoice Generator (+₹{invoiceConfig.addonFee})
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: isLight ? '#64748B' : '#94A3B8', lineHeight: 1.4 }}>
                          Generates a legal GST tax invoice with live customizable themes, company billing details, and instant print-ready A4 PDF export in your customer dashboard.
                        </p>
                      </div>
                    </label>

                    {hasInvoiceAddon && (
                      <div
                        style={{
                          borderTop: isLight ? '1px solid rgba(112, 56, 248, 0.15)' : '1px solid rgba(255, 255, 255, 0.08)',
                          paddingTop: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-purple, #A855F7)' }}>
                          Invoice Billing Information
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '2px' }}>
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={billingCompany}
                              onChange={e => setBillingCompany(e.target.value)}
                              placeholder="Registered Company Name"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.78rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '2px' }}>
                              GSTIN / Tax Identification
                            </label>
                            <input
                              type="text"
                              value={billingGstin}
                              onChange={e => setBillingGstin(e.target.value.toUpperCase())}
                              placeholder="e.g. 29AAACF9876Q1Z3"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.78rem' }}
                            />
                          </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: isLight ? '#64748B' : '#94A3B8', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={billingSameAsDelivery}
                            onChange={e => setBillingSameAsDelivery(e.target.checked)}
                          />
                          <span>Billing address is same as courier delivery address</span>
                        </label>

                        {!billingSameAsDelivery && (
                          <div>
                            <label style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', display: 'block', marginBottom: '2px' }}>
                              Registered Billing Address
                            </label>
                            <input
                              type="text"
                              value={billingAddress}
                              onChange={e => setBillingAddress(e.target.value)}
                              placeholder="Official Registered Office Address"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.78rem' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submission Main Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-lg"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: '0.96rem',
                        fontWeight: 800,
                        padding: '14px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.75 : 1
                      }}
                    >
                      {isSubmitting ? (
                        <span>Submitting Print Order...</span>
                      ) : (
                        <span>Submit Print Order</span>
                      )}
                    </button>

                    <p style={{ margin: 0, fontSize: '0.76rem', color: isLight ? '#64748B' : '#94A3B8', textAlign: 'center', lineHeight: 1.4 }}>
                      Submit your order for review. Our team will confirm the order and payment details through WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
