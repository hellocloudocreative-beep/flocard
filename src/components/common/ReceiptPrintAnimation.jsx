/* ==========================================================================
   FLOCARD 60FPS PRINT RECEIPT SIGNATURE INTERACTION COMPONENT
   Inspired by tactile digital receipt feeds (run-receipt-signature-interaction).
   Features realistic slot feeding, paper ejection spring motion, glowing laser line,
   digital signature checkmark, and haptic feel.
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Printer, Receipt, ShieldCheck } from 'lucide-react';

export default function ReceiptPrintAnimation({
  isOpen = false,
  title = "FLOCARDS TAX INVOICE",
  invoiceNumber = "INV-2026-3776",
  customerName = "Valued Client",
  totalAmount = "₹2,240",
  items = [],
  onComplete,
  onClose
}) {
  const [stage, setStage] = useState('feeding'); // 'feeding' -> 'signed' -> 'ready'

  useEffect(() => {
    if (!isOpen) {
      setStage('feeding');
      return;
    }

    // Phase 1: Feeding from slot (0 - 900ms)
    const t1 = setTimeout(() => {
      setStage('signed');
    }, 900);

    // Phase 2: Signed / Stamp animation (900ms - 1700ms)
    const t2 = setTimeout(() => {
      setStage('ready');
      if (onComplete) onComplete();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 4, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        {/* Printer Dispenser Head Slot */}
        <div
          style={{
            width: '320px',
            height: '18px',
            backgroundColor: '#1E1435',
            borderRadius: '9999px',
            border: '2px solid rgba(107, 0, 255, 0.5)',
            boxShadow: '0 0 25px rgba(107, 0, 255, 0.4), inset 0 2px 6px #000',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Laser Glow Bar */}
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
              scaleX: [0.95, 1.02, 0.95]
            }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '280px',
              height: '3px',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, transparent, #6B00FF, #A855F7, #6B00FF, transparent)',
              boxShadow: '0 0 12px #A855F7'
            }}
          />
        </div>

        {/* Paper Receipt Ejection Feed */}
        <motion.div
          initial={{ y: -160, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            damping: 18,
            stiffness: 120,
            mass: 0.8
          }}
          style={{
            width: '300px',
            backgroundColor: '#FAF9FE',
            color: '#1A132F',
            borderRadius: '0 0 16px 16px',
            marginTop: '-6px',
            padding: '24px 20px 20px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            fontFamily: 'Inter, monospace, system-ui, sans-serif',
            overflow: 'hidden'
          }}
        >
          {/* Jagged / Perforated Receipt Top Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #D1C7E8', paddingBottom: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#6B00FF', fontWeight: 800, fontSize: '0.96rem', letterSpacing: '0.08em' }}>
              <Sparkles size={14} />
              <span>FLOCARDS OFFICIAL</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6E6685', marginTop: '2px', fontWeight: 600 }}>
              {title}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9086A8', fontFamily: 'monospace', marginTop: '3px' }}>
              #{invoiceNumber} &bull; {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>

          {/* Billed To */}
          <div style={{ marginBottom: '12px', fontSize: '0.74rem', color: '#524A6B', display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer:</span>
            <strong style={{ color: '#1A132F' }}>{customerName}</strong>
          </div>

          {/* Line items preview */}
          <div style={{ borderTop: '1px dashed #E2D9F3', borderBottom: '1px dashed #E2D9F3', padding: '10px 0', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(items.length > 0 ? items.slice(0, 3) : [{ title: 'FLOCARDS NFC Card', amount: totalAmount }]).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: '#3A3250', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title || item.name || 'Custom Item'}
                </span>
                <span style={{ fontWeight: 700, color: '#1A132F' }}>
                  {typeof item.amount === 'number' ? `₹${item.amount}` : (item.amount || totalAmount)}
                </span>
              </div>
            ))}
          </div>

          {/* Total Amount Pill */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '6px 0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Paid</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#6B00FF' }}>{totalAmount}</span>
          </div>

          {/* Digital Signature Stamp Interaction */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ scale: 2.2, opacity: 0, rotate: -15 }}
              animate={stage === 'signed' || stage === 'ready' ? { scale: 1, opacity: 1, rotate: -4 } : {}}
              transition={{ type: 'spring', damping: 14, stiffness: 180 }}
              style={{
                border: '2px solid #10B981',
                borderRadius: '8px',
                padding: '4px 14px',
                color: '#10B981',
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)'
              }}
            >
              <Check size={14} strokeWidth={3} />
              <span>DIGITALLY SIGNED &amp; SEALED</span>
            </motion.div>
          </div>

          {/* Barcode Strip */}
          <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px dashed #E2D9F3', paddingTop: '10px' }}>
            <div style={{ height: '22px', background: 'repeating-linear-gradient(90deg, #1A132F 0px, #1A132F 2px, transparent 2px, transparent 5px, #1A132F 5px, #1A132F 7px)', opacity: 0.75, width: '80%', margin: '0 auto' }} />
            <div style={{ fontSize: '0.62rem', color: '#9086A8', letterSpacing: '0.2em', marginTop: '3px' }}>
              AUTHENTICATED RECEIPT
            </div>
          </div>
        </motion.div>

        {/* Floating status label & close button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: '22px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Printer size={16} color="#A855F7" />
            <span>{stage === 'ready' ? 'Receipt Generated & Verified!' : 'Printing Verified Tax Receipt...'}</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: '12px',
                padding: '6px 16px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
