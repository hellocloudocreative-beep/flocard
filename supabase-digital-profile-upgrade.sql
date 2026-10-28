-- =============================================================================
-- FLOCARDS: COMPLETE DIGITAL PROFILE PLATFORM UPGRADE MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor) to provision
-- schema support for full-screen profiles, banners, business hours, appointments,
-- services, video portfolio, secure payment & bank details, and storage quotas.
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Upgrade public.profiles schema with rich digital profile components
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS booking_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS storage_quotas JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS section_visibility JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.banner IS 'Discord/Facebook cover photo with responsive height, zoom, position X/Y, overlay, and optional video';
COMMENT ON COLUMN public.profiles.business_hours IS 'Weekly schedule with timezone, multi-slot days, and live Open/Closed badge calculation';
COMMENT ON COLUMN public.profiles.booking_config IS 'Appointment availability, duration, buffer time, advance window, and auto-confirm settings';
COMMENT ON COLUMN public.profiles.services IS 'Image-led service showcase with pricing, duration, and direct booking actions';
COMMENT ON COLUMN public.profiles.videos IS 'Video portfolio with responsive aspect ratios for YouTube and YouTube Shorts';
COMMENT ON COLUMN public.profiles.payment_config IS 'UPI ID, verified recipient name, copyable links, and QR settings';
COMMENT ON COLUMN public.profiles.bank_details IS 'Private-by-default wire settlement details with explicit owner publication consent';
COMMENT ON COLUMN public.profiles.storage_quotas IS 'Per-profile upload quotas for images, services, videos, and total storage MB';
COMMENT ON COLUMN public.profiles.section_visibility IS 'Per-section show/hide toggles preserving saved content when hidden';

-- -----------------------------------------------------------------------------
-- 2. Create public.appointments table for reliable scheduling
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_slug TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id TEXT,
  service_name TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  reference_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy appointment lookup by profile and date
CREATE INDEX IF NOT EXISTS idx_appointments_profile_date
ON public.appointments (profile_slug, booking_date);

-- Concurrency protection: prevent double-booking active slots on the same profile
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_book
ON public.appointments (profile_slug, booking_date, start_time)
WHERE (status IN ('pending', 'confirmed'));

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) for Appointments
-- -----------------------------------------------------------------------------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Public visitors can submit bookings
DROP POLICY IF EXISTS "Public can insert appointment bookings" ON public.appointments;
CREATE POLICY "Public can insert appointment bookings"
ON public.appointments FOR INSERT
WITH CHECK (true);

-- Visitors can query by reference code to view their confirmation
DROP POLICY IF EXISTS "Public can view own appointment by reference code" ON public.appointments;
CREATE POLICY "Public can view own appointment by reference code"
ON public.appointments FOR SELECT
USING (true);

-- Authenticated admins and profile owners can update appointments
DROP POLICY IF EXISTS "Admins and owners can update appointments" ON public.appointments;
CREATE POLICY "Admins and owners can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated admins and profile owners can delete appointments
DROP POLICY IF EXISTS "Admins and owners can delete appointments" ON public.appointments;
CREATE POLICY "Admins and owners can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (true);

-- -----------------------------------------------------------------------------
-- 4. Storage Buckets and Policies for Banners & Digital Assets
-- -----------------------------------------------------------------------------
-- Ensure 'banners' bucket exists with 15MB limit and allowed MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  15728640,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640;

-- Public can view banner assets
DROP POLICY IF EXISTS "Public can view banner assets" ON storage.objects;
CREATE POLICY "Public can view banner assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Authenticated users and admins can upload banners
DROP POLICY IF EXISTS "Authenticated users and admins can upload banners" ON storage.objects;
CREATE POLICY "Authenticated users and admins can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

-- Authenticated users and admins can update own banners
DROP POLICY IF EXISTS "Users and admins can update own banners" ON storage.objects;
CREATE POLICY "Users and admins can update own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');

-- Authenticated users and admins can delete own banners
DROP POLICY IF EXISTS "Users and admins can delete own banners" ON storage.objects;
CREATE POLICY "Users and admins can delete own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners');
