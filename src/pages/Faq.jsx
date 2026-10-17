/* ==========================================================================
   FLOCARD FAQ PAGE (/faq)
   ========================================================================== */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';

const FAQS = [
  {
    q: 'Does the other person need an app to receive my contact details?',
    a: 'No, absolutely not. Anyone with an iPhone or Android phone can tap or scan your FLOCARD. The notification opens natively in their mobile browser (Safari or Chrome), allowing them to view your digital portfolio and save your verified vCard directly to their contacts with a single tap.'
  },
  {
    q: 'Can I change my phone number or job title without buying a new card?',
    a: 'Yes, 100%. That is the primary superpower of FLOCARD. Your physical card is encoded with a permanent dynamic redirection URL (e.g. flocard.in/t/flc-yourcode). You can log in to your FLOCARD customer dashboard at any time to edit your contact numbers, social links, portfolio images, and bio. The changes update in the cloud instantaneously.'
  },
  {
    q: 'How durable is the physical card?',
    a: 'FLOCARD is built to outlast traditional wallets. Every card is waterproof (IP68 certified), bend-resistant, and scratch-resistant. The internal NXP NTAG216 microchip is rated for over 100,000 tap cycles and retains data for more than 10 years without requiring any battery or recharging.'
  },
  {
    q: 'Which smartphones are compatible with NFC tap?',
    a: 'Virtually all modern smartphones manufactured after 2018 support native background NFC reading. This includes iPhone XR, XS, 11, 12, 13, 14, 15, 16, 17+ and the vast majority of Android devices (Samsung Galaxy, Google Pixel, OnePlus, Xiaomi). For older devices or tablets without NFC, the back of every card features a laser-etched, scannable QR code.'
  },
  {
    q: 'How does the card designer export print-ready files?',
    a: 'Our Studio canvas renders standard ISO/IEC 7810 ID-1 proportions (85.6 × 54 mm). When you export your artwork, you can generate 300 DPI high-resolution PNGs as well as industrial double-sided PDF documents complete with standard 3mm bleed margins and printer crop marks.'
  },
  {
    q: 'Is my personal information secure?',
    a: 'Yes. We respect privacy. Your contact details are only shared when you deliberately tap your card against someone’s phone or let them scan your QR code. We do not sell your data or inject advertising into your profile.'
  }
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            QUESTIONS & ANSWERS
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', textTransform: 'uppercase', marginBottom: '16px' }}>
            FREQUENTLY ASKED <span className="text-gradient-purple">QUESTIONS</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            Everything you need to know about NFC technology, print standards, and digital profiles.
          </p>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  border: isOpen ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  style={{
                    width: '100%',
                    padding: '22px 24px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={20} color="var(--accent-purple)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                </button>

                {isOpen && (
                  <div style={{ padding: '0 24px 22px', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Still have questions? Our engineering team is happy to assist.
          </p>
          <a href="/contact" className="btn btn-secondary">
            <span>Contact Support</span>
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
