-- =============================================================================
-- FLOCARD SUPABASE DATABASE SCHEMA & ACCESS CONTROL (RLS)
-- Run this in your Supabase SQL Editor to provision all tables and security rules.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Digital Business Identity Portfolios)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    company TEXT,
    tagline TEXT,
    bio TEXT,
    avatar_url TEXT,
    theme TEXT DEFAULT 'purple' CHECK (theme IN ('purple', 'gold', 'platinum', 'custom')),
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    website TEXT,
    linkedin TEXT,
    instagram TEXT,
    twitter TEXT,
    github TEXT,
    location TEXT,
    services JSONB DEFAULT '[]'::jsonb,
    portfolio JSONB DEFAULT '[]'::jsonb,
    vcard_enabled BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'draft')),
    views_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NFC CARDS INVENTORY
CREATE TABLE IF NOT EXISTS public.nfc_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_code TEXT UNIQUE NOT NULL,
    chip_type TEXT DEFAULT 'NTAG216 (888 Bytes)',
    batch TEXT NOT NULL,
    edition TEXT DEFAULT 'purple' CHECK (edition IN ('purple', 'gold', 'platinum', 'custom')),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_slug TEXT REFERENCES public.profiles(slug) ON UPDATE CASCADE ON DELETE SET NULL,
    status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'assigned', 'shipped', 'active', 'revoked')),
    tap_count INTEGER DEFAULT 0,
    last_tapped_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CARD DESIGNS (Interactive Studio Artwork & Approval Workflow)
CREATE TABLE IF NOT EXISTS public.card_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    edition TEXT DEFAULT 'purple' CHECK (edition IN ('purple', 'gold', 'platinum', 'custom')),
    front_config JSONB NOT NULL,
    back_config JSONB NOT NULL,
    front_preview_url TEXT,
    back_preview_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'printed')),
    review_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ANALYTICS EVENTS (NFC Taps & Profile Engagements)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_code TEXT,
    profile_slug TEXT,
    event_type TEXT DEFAULT 'nfc_tap' CHECK (event_type IN ('nfc_tap', 'qr_scan', 'profile_view', 'vcard_download', 'share_click')),
    user_agent TEXT,
    os_name TEXT,
    browser TEXT,
    referrer TEXT,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDIT LOGS (Compliance & Security Record)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id),
    actor_email TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Public can view active profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (status = 'active');

-- Users can edit their own profiles
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- NFC Card lookup for public redirects
CREATE POLICY "Public card redirect lookup" 
ON public.nfc_cards FOR SELECT USING (status = 'active' OR status = 'assigned');

-- Users can view their own card designs
CREATE POLICY "Users can view own designs" 
ON public.card_designs FOR SELECT USING (auth.uid() = user_id);

-- Users can insert and update their own draft/submitted designs
CREATE POLICY "Users can create and edit own designs" 
ON public.card_designs FOR ALL USING (auth.uid() = user_id);

-- Public can insert analytics tap events
CREATE POLICY "Public can log analytics" 
ON public.analytics_events FOR INSERT WITH CHECK (true);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_code ON public.nfc_cards(card_code);
CREATE INDEX IF NOT EXISTS idx_card_designs_user ON public.card_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_slug ON public.analytics_events(profile_slug);
