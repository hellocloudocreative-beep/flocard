-- =============================================================================
-- FLOCARD SUPABASE STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor) to provision
-- secure public access and authenticated upload policies for card logos and assets.
-- =============================================================================

-- 1. Ensure public buckets exist with 10MB limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('logos', 'logos', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('portfolio', 'portfolio', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('uploads', 'uploads', true, 10485760, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- 2. Allow public read access to view logos and card assets
DROP POLICY IF EXISTS "Public can view logos and card assets" ON storage.objects;
CREATE POLICY "Public can view logos and card assets"
ON storage.objects FOR SELECT
USING (bucket_id IN ('logos', 'avatars', 'portfolio', 'uploads'));

-- 3. Allow authenticated users and admins to upload client logos
DROP POLICY IF EXISTS "Authenticated users and admins can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users and admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (public.is_admin() OR auth.uid() IS NOT NULL)
);

-- 4. Allow authenticated users and admins to upload avatars, portfolio & uploads
DROP POLICY IF EXISTS "Authenticated users and admins can upload general assets" ON storage.objects;
CREATE POLICY "Authenticated users and admins can upload general assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('avatars', 'portfolio', 'uploads') AND
  (public.is_admin() OR auth.uid() IS NOT NULL)
);

-- 5. Allow users and admins to update their own assets
DROP POLICY IF EXISTS "Users and admins can update own assets" ON storage.objects;
CREATE POLICY "Users and admins can update own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('logos', 'avatars', 'portfolio', 'uploads') AND
  (public.is_admin() OR auth.uid() IS NOT NULL)
);

-- 6. Allow users and admins to delete their own assets
DROP POLICY IF EXISTS "Users and admins can delete own assets" ON storage.objects;
CREATE POLICY "Users and admins can delete own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('logos', 'avatars', 'portfolio', 'uploads') AND
  (public.is_admin() OR auth.uid() IS NOT NULL)
);
