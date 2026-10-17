/* ==========================================================================
   FLOCARD LEGAL PAGES (Privacy Policy & Terms of Service)
   ========================================================================== */

import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import { BRAND } from '../lib/constants';

export default function Legal({ type = 'privacy' }) {
  const isPrivacy = type === 'privacy';
  const effectiveDate = 'October 14, 2026';

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div className="badge-tag" style={{ marginBottom: '12px' }}>
            {isPrivacy ? 'DATA & SECURITY' : 'TERMS OF SERVICE'}
          </div>
          <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            {isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Effective Date: {effectiveDate} &bull; FLOCARD Technologies
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '40px', fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          {isPrivacy ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>1. Our Commitment to Your Privacy</h3>
                <p>
                  At FLOCARD, we believe that your professional identity belongs entirely to you. When you tap a card or share your profile, your information is transmitted directly without selling, renting, or monetizing your personal contact records to third-party data brokers.
                </p>
              </section>

              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>2. Data Stored on the NFC Chip</h3>
                <p>
                  Physical FLOCARD NFC cards store solely a secure encrypted routing URI (such as <code>https://flocard.in/t/cardCode</code>). No sensitive personal passwords, biometric credentials, or credit card payment data are stored inside the physical card memory.
                </p>
              </section>

              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>3. Public Profile Visibility</h3>
                <p>
                  Your digital profile page is public by design, allowing prospective clients and business contacts to view your selected professional information. You maintain complete control over which phone numbers, email addresses, and social handles are visible or hidden.
                </p>
              </section>

              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>4. Analytics and Telemetry</h3>
                <p>
                  We aggregate anonymous tap statistics (device operating system, timestamp, and generalized region) to allow you to understand how frequently your card is engaged. We do not track fine-grained GPS locations.
                </p>
              </section>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>1. Acceptance of Terms</h3>
                <p>
                  By purchasing, configuring, or activating a FLOCARD smart card or digital identity profile, you agree to comply with and be bound by these Terms and Conditions.
                </p>
              </section>

              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>2. Hardware Warranty & Use</h3>
                <p>
                  FLOCARD hardware carries a 12-month manufacturer defect warranty against microchip failures under normal operating conditions. Damage caused by intentional bending or severe mechanical impact is not covered.
                </p>
              </section>

              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>3. Acceptable Use Policy</h3>
                <p>
                  You agree not to use FLOCARD digital profiles for phishing, malicious redirection, fraudulent misrepresentation of identity, or unauthorized commercial spam. Violations will result in immediate permanent revocation of the card redirect.
                </p>
              </section>

              <section>
                <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '10px' }}>4. Cloud Service Availability</h3>
                <p>
                  We aim for 99.9% uptime on our global redirect network and digital profile servers. Permanent card codes will remain resolvable for the lifetime of your active FLOCARD service.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
