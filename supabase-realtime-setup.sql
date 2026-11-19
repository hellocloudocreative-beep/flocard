-- =============================================================================
-- FLOCARD SUPABASE REALTIME CONFIGURATION & RLS HARDENING (FREE PLAN COMPATIBLE)
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/ekycoxwtwratujezngep/sql/new)
-- =============================================================================

-- 1. Ensure required core tables exist
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

-- 2. Ensure REPLICA IDENTITY is set to FULL on all synchronized tables
-- This ensures that UPDATE and DELETE events include the previous record for accurate diffing
ALTER TABLE IF EXISTS public.profiles REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.orders REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.nfc_cards REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.card_designs REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.invoices REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.appointments REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.audit_logs REPLICA IDENTITY FULL;

-- 3. Add all management tables to the supabase_realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nfc_cards;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.card_designs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 4. Update public.is_admin() helper to include all administrator and supervisor roles/emails
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

-- 5. Enable RLS Policies allowing Admins, Supervisors and Staff to receive Realtime change events
-- (Profiles)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP POLICY IF EXISTS "Admins can view and sync all profiles" ON public.profiles;
    CREATE POLICY "Admins can view and sync all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin() OR auth.uid() = user_id OR status = 'active');
  END IF;
END $$;

-- (Orders)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    DROP POLICY IF EXISTS "Admins and supervisors can view all orders" ON public.orders;
    CREATE POLICY "Admins and supervisors can view all orders"
    ON public.orders FOR SELECT
    USING (public.is_admin() OR auth.uid() = customer_id);
  END IF;
END $$;

-- (NFC Cards)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'nfc_cards') THEN
    DROP POLICY IF EXISTS "Admins can view all nfc cards" ON public.nfc_cards;
    CREATE POLICY "Admins can view all nfc cards"
    ON public.nfc_cards FOR SELECT
    USING (public.is_admin() OR auth.uid() = customer_id OR status IN ('active', 'assigned'));
  END IF;
END $$;

-- (Card Designs)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'card_designs') THEN
    DROP POLICY IF EXISTS "Admins can view all card designs" ON public.card_designs;
    CREATE POLICY "Admins can view all card designs"
    ON public.card_designs FOR SELECT
    USING (public.is_admin() OR auth.uid() = user_id);
  END IF;
END $$;

-- (Invoices)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
    CREATE POLICY "Admins can view all invoices"
    ON public.invoices FOR SELECT
    USING (public.is_admin() OR auth.uid() = customer_id);
  END IF;
END $$;

-- (Appointments)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
    DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
    CREATE POLICY "Admins can view all appointments"
    ON public.appointments FOR SELECT
    USING (public.is_admin() OR true);
  END IF;
END $$;
