/* ==========================================================================
   FLOCARDS OFFICIAL WHATSAPP CUSTOMER ACTION & PAYMENT ENGINE
   Features:
   - For Orders: Split WhatsApp options:
     1. "WhatsApp Details": Sends order details with Google Pay UPI payment link (₹2000 pre-filled).
        STRICT REQUIREMENT: NO public card link, NO QR image. Direct Google Pay payment link!
     2. "WhatsApp QR Code": Opens Dynamic Payment QR Code modal with exact payable amount pre-filled!
   - For Customers: Direct click-to-chat with customer
   - If no valid number: Clean disabled state
   ========================================================================== */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, PhoneOff, QrCode, ChevronDown, ExternalLink } from 'lucide-react';
import {
  getManualCustomerWhatsAppUrl,
  isValidWhatsAppNumber,
  getOrderWhatsAppPaymentDetailsUrl,
  getOrderUpiPaymentUrl
} from '../../lib/whatsapp';
import PaymentQrModal from './PaymentQrModal';

export default function WhatsAppContactButton({
  customerOrOrder,
  customMessage = '',
  size = 'sm',
  showLabel = true,
  onOpenPaymentQr = null,
  style = {}
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showInternalQrModal, setShowInternalQrModal] = useState(false);
  const containerRef = useRef(null);

  const rawNumber =
    customerOrOrder?.whatsapp ||
    customerOrOrder?.whatsappNumber ||
    customerOrOrder?.phone ||
    customerOrOrder?.customerPhone ||
    customerOrOrder?.customerDetails?.phone ||
    customerOrOrder?.customerDetails?.whatsapp ||
    '';

  const hasValidNumber = isValidWhatsAppNumber(rawNumber);

  // Determine if this is an order
  const isOrder = Boolean(
    customerOrOrder &&
    (customerOrOrder.orderReference ||
      customerOrOrder.orderDate ||
      customerOrOrder.edition ||
      customerOrOrder.templateType ||
      customerOrOrder.shippingAddress ||
      customerOrOrder.totalAmount !== undefined ||
      customerOrOrder.total_amount !== undefined ||
      (customerOrOrder.id && String(customerOrOrder.id).startsWith('ORD')))
  );

  const rawAmount = Number(
    customerOrOrder?.totalAmount ||
    customerOrOrder?.total_amount ||
    customerOrOrder?.pricing?.totalPayable ||
    customerOrOrder?.pricing?.total ||
    customerOrOrder?.unitPrice ||
    2000
  );
  const amount = isNaN(rawAmount) || rawAmount <= 0 ? 2000 : rawAmount;
  const formattedAmount = amount.toLocaleString('en-IN');

  const waDetailsUrl = isOrder && hasValidNumber
    ? getOrderWhatsAppPaymentDetailsUrl(customerOrOrder)
    : (hasValidNumber ? getManualCustomerWhatsAppUrl(customerOrOrder, customMessage) : null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  if (!hasValidNumber) {
    return (
      <span
        title="WhatsApp number not provided by customer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: size === 'sm' ? '4px 9px' : '7px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          border: '1px solid rgba(156, 163, 175, 0.25)',
          color: '#9CA3AF',
          fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
          fontWeight: 600,
          cursor: 'not-allowed',
          userSelect: 'none',
          ...style
        }}
      >
        <PhoneOff size={size === 'sm' ? 12 : 14} />
        {showLabel && <span>WhatsApp number not provided</span>}
      </span>
    );
  }

  // Handle opening WhatsApp Details
  const handleOpenWhatsAppDetails = (e) => {
    e.stopPropagation();
    setDropdownOpen(false);
    if (waDetailsUrl) {
      window.open(waDetailsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle opening WhatsApp QR Code
  const handleOpenWhatsAppQr = (e) => {
    e.stopPropagation();
    setDropdownOpen(false);
    if (onOpenPaymentQr) {
      onOpenPaymentQr(customerOrOrder);
    } else {
      setShowInternalQrModal(true);
    }
  };

  // If this is an order, provide the split choice: "WhatsApp Details" vs "WhatsApp QR Code"
  if (isOrder) {
    return (
      <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title="WhatsApp Options: Send Details or Show Payment QR Code"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: size === 'sm' ? '5px 11px' : '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#22C55E',
            border: '1px solid #16A34A',
            color: '#FFFFFF',
            fontSize: size === 'sm' ? '0.74rem' : '0.82rem',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
            transition: 'all 0.18s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#16A34A';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#22C55E';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <MessageCircle size={size === 'sm' ? 13 : 15} />
          {showLabel && <span>WhatsApp</span>}
          <ChevronDown size={size === 'sm' ? 11 : 13} style={{ opacity: 0.85, marginLeft: '1px' }} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 99999,
              minWidth: '240px',
              backgroundColor: '#110C1D',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(107, 0, 255, 0.25)',
              padding: '6px',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            {/* Header info */}
            <div
              style={{
                padding: '6px 10px 8px',
                borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
                marginBottom: '4px'
              }}
            >
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#A855F7', letterSpacing: '0.04em' }}>
                WhatsApp Actions
              </div>
              <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '1px' }}>
                Order #{customerOrOrder.orderReference || customerOrOrder.id}
              </div>
            </div>

            {/* Option 1: WhatsApp Details (Sends details with Google Pay link) */}
            <button
              type="button"
              onClick={handleOpenWhatsAppDetails}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                <MessageCircle size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>WhatsApp Details</span>
                  <ExternalLink size={10} style={{ opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#86EFAC', marginTop: '2px' }}>
                  Send details with Google Pay link (₹{formattedAmount})
                </div>
              </div>
            </button>

            {/* Option 2: WhatsApp QR Code (Opens Payment QR Code) */}
            <button
              type="button"
              onClick={handleOpenWhatsAppQr}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(107, 0, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#6B00FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                <QrCode size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>
                  WhatsApp QR Code
                </div>
                <div style={{ fontSize: '0.68rem', color: '#C084FC', marginTop: '2px' }}>
                  Display scannable ₹{formattedAmount} UPI payment QR
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Internal Payment QR Modal if opened directly without parent handler */}
        {showInternalQrModal && (
          <PaymentQrModal
            isOpen={showInternalQrModal}
            order={customerOrOrder}
            onClose={() => setShowInternalQrModal(false)}
          />
        )}
      </div>
    );
  }

  // Non-order direct customer WhatsApp link
  return (
    <a
      href={waDetailsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open WhatsApp chat with ${customerOrOrder.name || customerOrOrder.customerName || 'customer'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '5px 12px' : '8px 16px',
        borderRadius: '8px',
        backgroundColor: '#22C55E',
        border: '1px solid #16A34A',
        color: '#FFFFFF',
        fontSize: size === 'sm' ? '0.74rem' : '0.82rem',
        fontWeight: 700,
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
        transition: 'all 0.18s ease',
        cursor: 'pointer',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#16A34A';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#22C55E';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
      }}
    >
      <MessageCircle size={size === 'sm' ? 13 : 15} />
      {showLabel && <span>WhatsApp</span>}
    </a>
  );
}
