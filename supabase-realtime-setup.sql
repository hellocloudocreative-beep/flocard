-- =============================================================================
-- FLOCARD SUPABASE COMPLETE DATABASE PROVISIONING & REALTIME ACTIVATION
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/ekycoxwtwratujezngep/sql/new)
-- =============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Core Tables if they do not exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    company TEXT,
    tagline TEXT,
    bio TEXT,
    avatar_url TEXT,
    theme TEXT DEFAULT 'purple',
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
    status TEXT DEFAULT 'active',
    views_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'design_submitted',
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

CREATE TABLE IF NOT EXISTS public.nfc_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_code TEXT UNIQUE NOT NULL,
    chip_type TEXT DEFAULT 'NTAG216 (888 Bytes)',
    batch TEXT NOT NULL DEFAULT 'Batch-A',
    edition TEXT DEFAULT 'purple',
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_slug TEXT,
    status TEXT DEFAULT 'in_stock',
    tap_count INTEGER DEFAULT 0,
    last_tapped_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.card_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    edition TEXT DEFAULT 'purple',
    front_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    back_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    front_preview_url TEXT,
    back_preview_url TEXT,
    status TEXT DEFAULT 'draft',
    review_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID,
    order_reference TEXT NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    theme_id TEXT DEFAULT 'midnight_purple',
    custom_accent TEXT DEFAULT '#6B00FF',
    header_style TEXT DEFAULT 'bold_banner',
    pdf_filename TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_interest TEXT,
    preferred_date DATE,
    preferred_time TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Ensure REPLICA IDENTITY is set to FULL on all synchronized tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.nfc_cards REPLICA IDENTITY FULL;
ALTER TABLE public.card_designs REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- 4. Safely add all tables to the supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'nfc_cards') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.nfc_cards; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'card_designs') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.card_designs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- 5. Helper function for Admin & Staff verification
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' IN ('admin', 'owner', 'supervisor', 'sales', 'designer', 'production', 'accounts') OR
        auth.jwt() ->> 'email' IN (
            'flocard@flocard.in',
            'admin@flocard.in',
            'hello.flocard@gmail.com',
            'akhil@flocard.in'
        ) OR
        (auth.jwt() ->> 'email') LIKE '%@flocard.in'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Configure RLS Policies allowing Admins, Supervisors and Customers to access their records
DROP POLICY IF EXISTS "Admins can view and sync all profiles" ON public.profiles;
CREATE POLICY "Admins can view and sync all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin() OR auth.uid() = user_id OR status = 'active');

DROP POLICY IF EXISTS "Admins and supervisors can view all orders" ON public.orders;
CREATE POLICY "Admins and supervisors can view all orders"
ON public.orders FOR SELECT
USING (public.is_admin() OR auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can view all nfc cards" ON public.nfc_cards;
CREATE POLICY "Admins can view all nfc cards"
ON public.nfc_cards FOR SELECT
USING (public.is_admin() OR auth.uid() = customer_id OR status IN ('active', 'assigned'));

DROP POLICY IF EXISTS "Admins can view all card designs" ON public.card_designs;
CREATE POLICY "Admins can view all card designs"
ON public.card_designs FOR SELECT
USING (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
CREATE POLICY "Admins can view all invoices"
ON public.invoices FOR SELECT
USING (public.is_admin() OR auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments"
ON public.appointments FOR SELECT
USING (public.is_admin() OR true);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());
