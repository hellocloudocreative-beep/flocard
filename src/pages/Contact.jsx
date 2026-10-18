/* ==========================================================================
   FLOCARD CONTACT & ENTERPRISE INQUIRIES (/contact)
   ========================================================================== */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Building2 } from 'lucide-react';
import { BRAND } from '../lib/constants';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: 'general',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', company: '', inquiryType: 'general', message: '' });
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 60px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            CONNECT WITH US
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', textTransform: 'uppercase', marginBottom: '16px' }}>
            GET IN <span className="text-gradient-purple">TOUCH</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Have a question about custom team deployments, corporate bespoke finishes, or partnerships? Our team is at your service.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(24px, 4vw, 48px)', alignItems: 'start' }}>
          {/* Contact Details Card */}
          <div className="glass-panel" style={{ padding: '36px' }}>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Direct Information
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              We collaborate with global founders, executive teams, and creative agencies to deploy seamless contactless identity solutions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Inquiries</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{BRAND.supportEmail}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Headquarters</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>Bengaluru, Karnataka, India</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Corporate Orders</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>Bulk provisioning for 20 to 10,000+ staff</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '36px' }}>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Send an Inquiry
            </h3>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Message Received!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Thank you for reaching out. A FLOCARD specialist will respond within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Elena Rostova"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="elena@example.com"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Company / Brand</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Inquiry Purpose</label>
                    <select
                      className="form-select"
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="corporate">Corporate Team Cards (20+)</option>
                      <option value="custom">Bespoke Metal Finishes</option>
                      <option value="partnership">Press & Partnerships</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Message</label>
                  <textarea
                    required
                    rows="4"
                    className="form-textarea"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help elevate your brand identity?"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  <Send size={16} />
                  <span>Transmit Message</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
