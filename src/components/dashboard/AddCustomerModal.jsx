/* ==========================================================================
   FLOCARDS MANUAL CUSTOMER CREATION MODAL
   Allows administrator to create customer records without forced registration.
   Fields:
   - Full Name (required)
   - Phone Number (optional - never generate fake numbers)
   - WhatsApp Number (optional)
   - Email Address (optional)
   - Business / Company Name (optional)
   - Admin Notes (optional)
   ========================================================================== */

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AddCustomerModal({
  isOpen = false,
  onClose = () => {},
  onSaveCustomer = () => {},
  existingCustomers = [],
  isDark = true
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setCompany('');
    setNotes('');
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide a customer name (at least 2 characters).');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setError('Please provide a valid email address or leave it empty.');
      return;
    }

    // Check duplicate by email if email was provided
    if (trimmedEmail) {
      const duplicate = existingCustomers.find(
        c => c.email && c.email.toLowerCase().trim() === trimmedEmail.toLowerCase()
      );
      if (duplicate) {
        setError(`A customer with email ${trimmedEmail} already exists (${duplicate.name}).`);
        return;
      }
    }

    const trimmedPhone = phone.trim();
    const finalWhatsapp = sameAsPhone ? trimmedPhone : whatsapp.trim();

    setIsSubmitting(true);

    try {
      const newCust = {
        name: trimmedName,
        email: trimmedEmail || '',
        phone: trimmedPhone || '',
        whatsapp: finalWhatsapp || '',
        company: company.trim() || '',
        notes: notes.trim() || '',
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      await onSaveCustomer(newCust);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create customer record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = {
    modalBg: isDark ? '#0D0916' : '#FFFFFF',
    border: isDark ? 'rgba(112, 56, 248, 0.25)' : 'rgba(107, 0, 255, 0.15)',
    textPrimary: isDark ? '#FFFFFF' : '#191522',
    textSecondary: isDark ? '#9E95AF' : '#686074',
    inputBg: isDark ? '#140E20' : '#F8F6FD',
    inputBorder: isDark ? 'rgba(112, 56, 248, 0.25)' : '#E4D8FF',
    brandPurple: '#6B00FF',
    brandPurpleHover: '#5B00DB',
    brandGradient: 'linear-gradient(135deg, #6B00FF 0%, #9B51E0 100%)'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: colors.modalBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: 'rgba(107, 0, 255, 0.15)',
                border: '1px solid rgba(107, 0, 255, 0.28)',
                color: isDark ? '#C084FC' : '#6B00FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserPlus size={19} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary }}>
                Add New Customer
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: colors.textSecondary }}>
                Create a customer record in your database. Phone &amp; email are optional.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
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
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: colors.textPrimary }}>
              Customer Full Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Farhan Ali"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${colors.inputBorder}`,
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: colors.textPrimary }}>
                Business / Company (Optional)
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Innovate Tech"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.inputBorder}`,
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: colors.textPrimary }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farhan@example.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.inputBorder}`,
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: colors.textPrimary }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.inputBorder}`,
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: colors.textPrimary }}>
                WhatsApp Number (Optional)
              </label>
              <input
                type="tel"
                disabled={sameAsPhone}
                value={sameAsPhone ? phone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="919876543210"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.inputBorder}`,
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  fontSize: '0.84rem',
                  outline: 'none',
                  opacity: sameAsPhone ? 0.7 : 1,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: colors.textSecondary, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={sameAsPhone}
              onChange={(e) => setSameAsPhone(e.target.checked)}
              style={{ accentColor: '#6B00FF', cursor: 'pointer' }}
            />
            <span>WhatsApp number is same as phone number</span>
          </label>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: colors.textPrimary }}>
              Internal Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Met at tech conference, requested Gold NFC sample."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: `1px solid ${colors.inputBorder}`,
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                background: 'none',
                color: colors.textSecondary,
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: colors.brandGradient,
                color: '#FFFFFF',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(107, 0, 255, 0.4)',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 0, 255, 0.55)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 0, 255, 0.4)';
              }}
            >
              {isSubmitting ? 'Saving...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

