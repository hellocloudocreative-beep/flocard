/* ==========================================================================
   FLOCARDS MANUAL WHATSAPP CUSTOMER CONTACT BUTTON
   Requirements:
   - Clicking opens WhatsApp (web or mobile) with customer's number
   - Prefills polite message: "Hello [Customer Name], we received your FLOCARDS card request. We will contact you regarding the next steps."
   - Lets admin review and manually click Send in WhatsApp
   - NEVER sends automatically in background without admin action
   - NEVER requires third-party API keys or WhatsApp Cloud API for manual contact
   - If no valid number exists, cleanly displays "WhatsApp number not provided" (disabled)
   ========================================================================== */

import React from 'react';
import { MessageCircle, PhoneOff } from 'lucide-react';
import { getManualCustomerWhatsAppUrl, isValidWhatsAppNumber } from '../../lib/whatsapp';

export default function WhatsAppContactButton({
  customerOrOrder,
  customMessage = '',
  size = 'sm',
  showLabel = true,
  style = {}
}) {
  const rawNumber =
    customerOrOrder?.whatsapp ||
    customerOrOrder?.whatsappNumber ||
    customerOrOrder?.phone ||
    customerOrOrder?.customerPhone ||
    customerOrOrder?.customerDetails?.phone ||
    customerOrOrder?.customerDetails?.whatsapp ||
    '';

  const hasValidNumber = isValidWhatsAppNumber(rawNumber);
  const waUrl = hasValidNumber ? getManualCustomerWhatsAppUrl(customerOrOrder, customMessage) : null;

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

  return (
    <a
      href={waUrl}
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

