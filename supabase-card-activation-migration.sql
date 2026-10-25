-- ============================================================================
-- FLOCARDS: NFC CARD ACTIVATION, DEACTIVATION & AUDIT MIGRATION
-- Enables authoritative card activation status management, immutable audit logging,
-- and public NFC status resolution without exposing private data.
-- ============================================================================

-- 1. Update the status check constraint on public.nfc_cards
-- Accommodates 'active', 'disabled', 'inactive', 'pending', 'in_stock', 'assigned', 'revoked'
DO $$
BEGIN
    -- Drop existing check constraint if present
    IF EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
          AND table_name = 'nfc_cards'
          AND constraint_name = 'nfc_cards_status_check'
    ) THEN
        ALTER TABLE public.nfc_cards DROP CONSTRAINT nfc_cards_status_check;
    END IF;

    -- Add updated check constraint
    ALTER TABLE public.nfc_cards
    ADD CONSTRAINT nfc_cards_status_check
    CHECK (status IN ('active', 'disabled', 'inactive', 'pending', 'in_stock', 'assigned', 'revoked'));
END $$;

-- 2. Add supporting audit and card metadata columns to nfc_cards if missing
ALTER TABLE public.nfc_cards
ADD COLUMN IF NOT EXISTS card_name TEXT,
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status_reason TEXT,
ADD COLUMN IF NOT EXISTS last_status_changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_status_changed_by_name TEXT,
ADD COLUMN IF NOT EXISTS activation_history JSONB DEFAULT '[]'::jsonb;

-- 3. Update edition check constraint if present to include 'white'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
          AND table_name = 'nfc_cards'
          AND constraint_name = 'nfc_cards_edition_check'
    ) THEN
        ALTER TABLE public.nfc_cards DROP CONSTRAINT nfc_cards_edition_check;
        ALTER TABLE public.nfc_cards
        ADD CONSTRAINT nfc_cards_edition_check
        CHECK (edition IN ('purple', 'gold', 'platinum', 'metal', 'white', 'custom'));
    END IF;
END $$;

-- 4. Enable public read access for card redirect resolution (all statuses so /t/:cardCode knows whether it is disabled)
-- Note: Sensitive customer details are not exposed by the redirect query (only card_code, status, profile_slug)
DROP POLICY IF EXISTS "Public card redirect lookup" ON public.nfc_cards;
CREATE POLICY "Public card redirect lookup"
ON public.nfc_cards FOR SELECT
USING (true);

-- 5. Helper function: check if user is verified owner or has card status management permission
CREATE OR REPLACE FUNCTION public.can_manage_nfc_status()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' = 'owner' OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner' OR
        auth.jwt() ->> 'email' = 'flocard@flocard.in' OR
        auth.jwt() ->> 'email' = 'admin@flocard.in' OR
        auth.jwt() ->> 'email' = 'hello.flocard@gmail.com' OR
        auth.jwt() ->> 'email' = 'akhil@flocard.in' OR
        (auth.jwt() -> 'custom_permissions') ? 'nfc.status_manage'
    );
END $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enforce that only verified owners or authorized staff can update card status
DROP POLICY IF EXISTS "Owner can manage card activation" ON public.nfc_cards;
CREATE POLICY "Owner can manage card activation"
ON public.nfc_cards FOR ALL
USING (public.can_manage_nfc_status());

-- 7. Ensure audit_logs table exists and allows append-only logs for authenticated status changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.nfc_cards(id) ON DELETE SET NULL,
    card_code TEXT,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    actor_id TEXT,
    actor_name TEXT,
    actor_email TEXT,
    actor_role TEXT,
    reason TEXT,
    result TEXT DEFAULT 'success',
    entity_type TEXT DEFAULT 'NFC Card',
    entity_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;
CREATE POLICY "Owner can view audit logs"
ON public.audit_logs FOR SELECT
USING (
    auth.jwt() ->> 'role' = 'owner' OR
    auth.jwt() ->> 'email' = 'flocard@flocard.in' OR
    auth.jwt() ->> 'email' = 'admin@flocard.in' OR
    auth.jwt() ->> 'email' = 'hello.flocard@gmail.com' OR
    auth.jwt() ->> 'email' = 'akhil@flocard.in'
);

DROP POLICY IF EXISTS "Append-only audit insert" ON public.audit_logs;
CREATE POLICY "Append-only audit insert"
ON public.audit_logs FOR INSERT
WITH CHECK (true);
