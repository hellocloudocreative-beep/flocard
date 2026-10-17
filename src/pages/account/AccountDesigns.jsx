/* ==========================================================================
   FLOCARD SAVED CARD DESIGNS LIST (/account/designs)
   ========================================================================== */

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Layers, ArrowRight, Download, Edit3, Plus, Sparkles, Check, Clock } from 'lucide-react';
import Card3DPreview from '../../components/Card3DPreview';

export default function AccountDesigns() {
  const { user } = useAuth();
  const { designs } = useData();
  const [filter, setFilter] = useState('all');

  const filtered = designs.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 30px)', paddingBottom: '80px' }}>
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '36px'
          }}
        >
          <div>
            <div className="badge-tag" style={{ marginBottom: '10px' }}>
              DESIGN GALLERY
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', textTransform: 'uppercase' }}>
              MY SAVED <span className="text-gradient-purple">CARD DESIGNS</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              Review, edit in studio, or download high-resolution print artwork.
            </p>
          </div>

          <a href="/designer" className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Design</span>
          </a>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(23, 16, 32, 0.9)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            marginBottom: '32px',
            gap: '4px'
          }}
        >
          {['all', 'approved', 'submitted', 'in_review', 'draft'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              style={{
                background: filter === st ? 'var(--primary-purple)' : 'transparent',
                color: filter === st ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer'
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Designs Grid */}
        <div className="grid-2" style={{ alignItems: 'stretch' }}>
          {filtered.map(design => (
            <div
              key={design.id}
              className="glass-panel"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                    {design.title}
                  </h3>
                  <span
                    className="badge-tag"
                    style={{
                      background: design.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: design.status === 'approved' ? '#34d399' : '#fbbf24',
                      borderColor: design.status === 'approved' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    {design.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ margin: '20px 0', textAlign: 'center' }}>
                  <Card3DPreview
                    edition={design.edition}
                    templateType={design.templateType || 'standard'}
                    config={{ front: design.front, back: design.back }}
                    width={340}
                    allowFlip={true}
                  />
                </div>

                {design.reviewNotes && (
                  <div style={{ background: 'rgba(23, 16, 32, 0.8)', padding: '12px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    <strong style={{ color: 'var(--light-lavender)' }}>Printmaster Review: </strong>
                    {design.reviewNotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <a
                  href={`/designer?id=${design.id}&edition=${design.edition}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Edit3 size={14} />
                  <span>Edit in Studio</span>
                </a>

                <a
                  href={`/designer?id=${design.id}&edition=${design.edition}`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Download size={14} />
                  <span>Export Artwork</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
