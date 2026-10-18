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

-- 6. ORDERS TABLE (Fulfillment Pipeline)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_reference TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'design_submitted' CHECK (
        status IN (
            'design_submitted',
            'artwork_approved',
            'manufacturing_started',
            'quality_inspection',
            'dispatched',
            'delivered',
            'revision_required',
            'on_hold',
            'manufacturing_issue',
            'delivery_issue',
            'cancelled'
        )
    ),
    shipping_address TEXT,
    tracking_number TEXT,
    carrier_name TEXT,
    tracking_url TEXT,
    estimated_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    total_amount NUMERIC(10, 2) DEFAULT 1999.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    card_edition TEXT DEFAULT 'purple' CHECK (card_edition IN ('purple', 'gold', 'platinum', 'custom')),
    template_type TEXT DEFAULT 'standard' CHECK (template_type IN ('standard', 'customer_logo')),
    approved_design_id UUID REFERENCES public.card_designs(id) ON DELETE SET NULL,
    design_title TEXT,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) DEFAULT 1999.00,
    card_code TEXT REFERENCES public.nfc_cards(card_code) ON DELETE SET NULL,
    profile_slug TEXT REFERENCES public.profiles(slug) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER STATUS HISTORY (Immutable Fulfillment Audit Trail)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    public_message TEXT,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL DEFAULT 'Operations Team',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER INTERNAL NOTES (Private Admin Only - Never Exposed to Customers)
CREATE TABLE IF NOT EXISTS public.order_internal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT 'Administrator',
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CUSTOMER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.customer_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'email' = 'akhil@flocard.in' OR
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- NFC Cards
CREATE POLICY "Public card redirect lookup" 
ON public.nfc_cards FOR SELECT USING (status = 'active' OR status = 'assigned');

CREATE POLICY "Users can view their own cards"
ON public.nfc_cards FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Admins can manage all cards"
ON public.nfc_cards FOR ALL USING (public.is_admin());

-- Card Designs
CREATE POLICY "Users can view own designs" 
ON public.card_designs FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create and edit own designs" 
ON public.card_designs FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Analytics Events
CREATE POLICY "Public can log analytics" 
ON public.analytics_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view analytics for their own profile"
ON public.analytics_events FOR SELECT USING (
    profile_slug IN (SELECT slug FROM public.profiles WHERE user_id = auth.uid()) OR
    public.is_admin()
);

-- Audit Logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT USING (public.is_admin());

CREATE POLICY "Authorized actions can insert audit logs"
ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Orders
CREATE POLICY "Customers can view only their own orders"
ON public.orders FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Customers can create draft orders"
ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE USING (public.is_admin());

-- Order Items
CREATE POLICY "Customers can view only their own order items"
ON public.order_items FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()) OR
    public.is_admin()
);

CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL USING (public.is_admin());

-- Order Status History (Customers can view public timeline, admins manage)
CREATE POLICY "Customers can view history for their own orders"
ON public.order_status_history FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()) OR
    public.is_admin()
);

CREATE POLICY "Admins can record order status history"
ON public.order_status_history FOR INSERT WITH CHECK (public.is_admin());

-- Order Internal Notes (STRICTLY ADMIN ONLY - Never accessible to customers)
CREATE POLICY "Only admins can access internal notes"
ON public.order_internal_notes FOR ALL USING (public.is_admin());

-- Customer Notifications
CREATE POLICY "Customers can view only their own notifications"
ON public.customer_notifications FOR SELECT USING (auth.uid() = recipient_user_id);

CREATE POLICY "Customers can update their own notification read status"
ON public.customer_notifications FOR UPDATE USING (auth.uid() = recipient_user_id);

CREATE POLICY "Admins and system can insert notifications"
ON public.customer_notifications FOR INSERT WITH CHECK (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_code ON public.nfc_cards(card_code);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_customer ON public.nfc_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_card_designs_user ON public.card_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_slug ON public.analytics_events(profile_slug);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_order ON public.order_internal_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.customer_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.customer_notifications(recipient_user_id, read_at);

