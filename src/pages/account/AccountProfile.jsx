/* ==========================================================================
   FLOCARD DIGITAL PROFILE EDITOR (/account/profile)
   Full support for uploading executive Avatar/Photo, Company Logo,
   and Portfolio Work Showcase Images with live interactive smartphone preview.
   ========================================================================== */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Save,
  Check,
  ExternalLink,
  User,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Building2,
  Camera,
  X,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import PhoneProfileMockup from '../../components/PhoneProfileMockup';
import { uploadImage } from '../../lib/uploadImage';

export default function AccountProfile() {
  const { user } = useAuth();
  const { profiles, saveProfile } = useData();

  const userProfile = profiles.find(p => p.slug === (user?.profileSlug || 'alex')) || profiles[0];

  const [formData, setFormData] = useState({
    name: userProfile?.name || user?.name || 'Your Name',
    role: userProfile?.role || 'Executive',
    company: userProfile?.company || 'FLOCARD',
    avatar: userProfile?.avatar || '',
    logo: userProfile?.logo || '',
    tagline: userProfile?.tagline || 'Pioneering Connected Digital Identity.',
    bio: userProfile?.bio || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || '',
    whatsapp: userProfile?.whatsapp || '',
    location: userProfile?.location || 'Bengaluru, India',
    website: userProfile?.website || 'https://flocard.in',
    linkedin: userProfile?.linkedin || '',
    instagram: userProfile?.instagram || '',
    twitter: userProfile?.twitter || '',
    github: userProfile?.github || '',
    services: userProfile?.services || [],
    portfolio: userProfile?.portfolio || []
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const bulkWorkInputRef = useRef(null);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || prev.name,
        role: userProfile.role || prev.role,
        company: userProfile.company || prev.company,
        avatar: userProfile.avatar !== undefined ? userProfile.avatar : prev.avatar,
        logo: userProfile.logo !== undefined ? userProfile.logo : prev.logo,
        tagline: userProfile.tagline !== undefined ? userProfile.tagline : prev.tagline,
        bio: userProfile.bio !== undefined ? userProfile.bio : prev.bio,
        phone: userProfile.phone !== undefined ? userProfile.phone : prev.phone,
        email: userProfile.email !== undefined ? userProfile.email : prev.email,
        whatsapp: userProfile.whatsapp !== undefined ? userProfile.whatsapp : prev.whatsapp,
        location: userProfile.location !== undefined ? userProfile.location : prev.location,
        website: userProfile.website !== undefined ? userProfile.website : prev.website,
        linkedin: userProfile.linkedin !== undefined ? userProfile.linkedin : prev.linkedin,
        instagram: userProfile.instagram !== undefined ? userProfile.instagram : prev.instagram,
        portfolio: userProfile.portfolio || prev.portfolio
      }));
    }
  }, [userProfile?.id]);

  // Handle Avatar / Headshot Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'avatar', user?.id || 'anon');
      setFormData(prev => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
    e.target.value = '';
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'logo', user?.id || 'anon');
      setFormData(prev => ({ ...prev, logo: url }));
    } catch (err) {
      console.error('Logo upload failed:', err);
    }
    e.target.value = '';
  };

  // Handle Individual Work Image Upload
  const handleWorkImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'portfolio', user?.id || 'anon');
      setFormData(prev => {
        const next = [...prev.portfolio];
        next[index] = { ...next[index], image: url };
        return { ...prev, portfolio: next };
      });
    } catch (err) {
      console.error('Work image upload failed:', err);
    }
    e.target.value = '';
  };

  // Remove Work Image from Item
  const handleRemoveWorkImage = (index) => {
    setFormData(prev => {
      const next = [...prev.portfolio];
      next[index] = { ...next[index], image: '' };
      return { ...prev, portfolio: next };
    });
  };

  // Add Blank Portfolio Item
  const addPortfolioItem = () => {
    setFormData(prev => ({
      ...prev,
      portfolio: [
        ...prev.portfolio,
        {
          id: `port_${Date.now()}`,
          title: 'Featured Work Sample',
          category: 'Case Study',
          desc: 'Summary of project deliverables, design execution, and impact.',
          image: '',
          link: ''
        }
      ]
    }));
  };

  // Remove Portfolio Item
  const removePortfolioItem = (id) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(p => p.id !== id)
    }));
  };

  // Bulk Upload Multiple Work Images
  const handleBulkWorkUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        const url = await uploadImage(file, 'portfolio', user?.id || 'anon');
        const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        setFormData(prev => ({
          ...prev,
          portfolio: [
            ...prev.portfolio,
            {
              id: `port_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              title: cleanTitle || 'New Work Showcase',
              category: 'Work Showcase',
              desc: 'Client showcase deliverables and visual portfolio preview.',
              image: url,
              link: ''
            }
          ]
        }));
      } catch (err) {
        console.error('Work upload error:', err);
      }
    }
    e.target.value = '';
  };

  // Submit Profile Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const updated = {
      ...userProfile,
      ...formData,
      slug: userProfile?.slug || 'alex',
      updatedAt: new Date().toISOString()
    };
    await saveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 30px)', paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '1320px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="badge-tag" style={{ marginBottom: '8px' }}>
              PROFILE EDITOR
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', textTransform: 'uppercase' }}>
              EDIT YOUR <span className="text-gradient-purple">DIGITAL IDENTITY</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Upload your logo, headshot, and work portfolio. Changes reflect immediately on your live NFC link: <code style={{ color: 'var(--light-lavender)' }}>flocard.in/p/{userProfile?.slug}</code>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={`/p/${userProfile?.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              <span>Preview Live Profile</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* 2-Column: Form on Left | Phone Mockup Preview on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '36px', alignItems: 'start' }} className="profile-edit-grid">
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px' }}>

            {/* ================================================================
                SECTION 1: LOGO & AVATAR UPLOAD
                ================================================================ */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '6px' }}>
                Profile Media & Branding
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>
                Upload your official photo and company logo to represent your brand across NFC taps and mobile browsers.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
                {/* 1. Profile Picture / Avatar */}
                <div
                  style={{
                    background: 'rgba(23, 16, 32, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={16} color="var(--accent-purple)" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Profile Headshot / Photo</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '76px',
                        height: '76px',
                        minWidth: '76px',
                        borderRadius: '50%',
                        padding: '2.5px',
                        background: 'linear-gradient(135deg, var(--accent-purple), var(--primary-purple))',
                        boxShadow: '0 0 16px rgba(107, 0, 255, 0.4)',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                        alt={formData.name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="file"
                        ref={avatarInputRef}
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ width: 'fit-content' }}
                      >
                        <Upload size={14} />
                        <span>{formData.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>

                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: '' })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#F87171',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: 0
                          }}
                        >
                          Remove custom photo
                        </button>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        JPG, PNG, WebP (400x400 recommended)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Company / Brand Logo */}
                <div
                  style={{
                    background: 'rgba(23, 16, 32, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} color="var(--accent-purple)" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Company / Brand Logo</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '76px',
                        height: '76px',
                        minWidth: '76px',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)',
                        background: '#0D0915',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      {formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="Logo Preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <Building2 size={28} color="#432E5E" />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ width: 'fit-content' }}
                      >
                        <Upload size={14} />
                        <span>{formData.logo ? 'Change Logo' : 'Upload Logo'}</span>
                      </button>

                      {formData.logo && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo: '' })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#F87171',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: 0
                          }}
                        >
                          Remove logo
                        </button>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        PNG transparent, SVG or JPG
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================
                SECTION 2: BASIC INFORMATION
                ================================================================ */}
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              Basic Information
            </h3>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Title / Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Company / Organization</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tagline (One-line Hook)</label>
              <input
                type="text"
                className="form-input"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Biography / About</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            {/* ================================================================
                SECTION 3: CONTACT & SOCIAL
                ================================================================ */}
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '28px 0 16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              Contact & Social Channels
            </h3>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Phone Number (vCard)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Number (e.g. 919876543210)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instagram URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>
            </div>

            {/* ================================================================
                SECTION 4: WORK IMAGES & PORTFOLIO SHOWCASE
                ================================================================ */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '28px', paddingTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '4px' }}>
                    Work Portfolio & Project Showcase
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Upload images of your past work, products, or case studies to display on your public profile.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="file"
                    ref={bulkWorkInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleBulkWorkUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => bulkWorkInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    title="Upload multiple images to create work cards"
                  >
                    <Upload size={14} />
                    <span>Upload Work Images</span>
                  </button>

                  <button
                    type="button"
                    onClick={addPortfolioItem}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={14} />
                    <span>Add Project</span>
                  </button>
                </div>
              </div>

              {formData.portfolio.length === 0 ? (
                <div
                  style={{
                    background: 'rgba(23, 16, 32, 0.4)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '16px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    marginBottom: '24px'
                  }}
                >
                  <ImageIcon size={36} color="var(--accent-purple)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
                  <div style={{ color: '#FFFFFF', fontWeight: 600, marginBottom: '6px' }}>No work images added yet</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
                    Upload your project screenshots or portfolio graphics to showcase your work directly on your NFC profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => bulkWorkInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                  >
                    <Upload size={14} />
                    <span>Browse & Upload Images</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
                  {formData.portfolio.map((item, idx) => {
                    const itemFileInputRef = `work_file_${idx}`;
                    return (
                      <div
                        key={item.id || idx}
                        style={{
                          background: 'rgba(23, 16, 32, 0.85)',
                          padding: '20px',
                          borderRadius: '16px',
                          border: '1px solid var(--border-color)',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                        }}
                      >
                        {/* Header of Item */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Project #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePortfolioItem(item.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#F87171',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem'
                            }}
                            title="Delete this project"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Grid: Work Image on Left | Metadata on Right */}
                        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '20px' }} className="work-item-grid">
                          {/* Left: Work Image Upload & Thumbnail */}
                          <div>
                            <input
                              type="file"
                              id={itemFileInputRef}
                              accept="image/*"
                              onChange={(e) => handleWorkImageUpload(idx, e)}
                              style={{ display: 'none' }}
                            />

                            {item.image ? (
                              <div style={{ position: 'relative', width: '100%', height: '125px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(8, 6, 13, 0.65)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}
                                  className="image-hover-overlay"
                                >
                                  <label
                                    htmlFor={itemFileInputRef}
                                    style={{
                                      background: '#6B00FF',
                                      color: '#FFFFFF',
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Change
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveWorkImage(idx)}
                                    style={{
                                      background: '#DC2626',
                                      border: 'none',
                                      color: '#FFFFFF',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      cursor: 'pointer'
                                    }}
                                    title="Remove Image"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label
                                htmlFor={itemFileInputRef}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  height: '125px',
                                  borderRadius: '12px',
                                  border: '2px dashed var(--border-color)',
                                  background: 'rgba(13, 9, 21, 0.6)',
                                  cursor: 'pointer',
                                  padding: '12px',
                                  textAlign: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Upload size={20} color="var(--accent-purple)" style={{ marginBottom: '6px' }} />
                                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#FFFFFF' }}>Upload Work Image</span>
                                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>Click to select</span>
                              </label>
                            )}
                          </div>

                          {/* Right: Project Title, Category, Desc, Link */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="grid-2">
                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Project Title</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="e.g. Obsidian NFC Architecture"
                                  value={item.title || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.portfolio];
                                    updated[idx].title = e.target.value;
                                    setFormData({ ...formData, portfolio: updated });
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Category / Discipline</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="e.g. Industrial Design / Hardware"
                                  value={item.category || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.portfolio];
                                    updated[idx].category = e.target.value;
                                    setFormData({ ...formData, portfolio: updated });
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Project Description</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Short summary of technical innovation, scope, or client outcome"
                                value={item.desc || ''}
                                onChange={(e) => {
                                    const updated = [...formData.portfolio];
                                    updated[idx].desc = e.target.value;
                                    setFormData({ ...formData, portfolio: updated });
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Project / Live Link (Optional)</label>
                              <input
                                type="url"
                                className="form-input"
                                placeholder="https://behance.net/gallery/... or https://yourcompany.com"
                                value={item.link || ''}
                                onChange={(e) => {
                                    const updated = [...formData.portfolio];
                                    updated[idx].link = e.target.value;
                                    setFormData({ ...formData, portfolio: updated });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <button type="submit" className="btn btn-primary btn-lg">
                <Save size={18} />
                <span>Save Profile Changes</span>
              </button>

              {savedSuccess && (
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Check size={18} /> Profile & Work Images Saved Successfully!
                </span>
              )}
            </div>
          </form>

          {/* Phone Live Preview */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>
              Live Phone Preview
            </h4>
            <PhoneProfileMockup
              profile={{
                ...userProfile,
                ...formData
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .profile-edit-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .work-item-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .image-hover-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
