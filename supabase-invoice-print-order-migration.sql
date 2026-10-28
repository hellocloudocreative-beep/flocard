-- ==========================================================================
-- FLOCARDS INVOICE GENERATOR & PRINT ORDER SUBMISSION SCHEMA MIGRATION
-- Safely applies schema updates for print orders, payment verification,
-- itemized pricing breakdown, invoice add-on eligibility, and invoices table.
-- ==========================================================================

-- 1. EXPAND STATUS CHECK CONSTRAINT ON ORDERS
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
    status IN (
        -- New 10-stage workflow
        'new_order',
        'design_review',
        'awaiting_confirmation',
        'awaiting_payment',
        'payment_confirmed',
        'manufacturing',
        'quality_check',
        'dispatched',
        'delivered',
        'cancelled',
        -- Legacy pipeline backward-compatibility
        'design_submitted',
        'artwork_approved',
        'manufacturing_started',
        'quality_inspection',
        'revision_required',
        'on_hold',
        'manufacturing_issue',
        'delivery_issue'
    )
);

-- 2. ADD PAYMENT & INVOICE ADD-ON FIELDS TO ORDERS
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'payment_pending'
        CHECK (payment_status IN ('payment_pending', 'payment_confirmed', 'refunded', 'waived')),
    ADD COLUMN IF NOT EXISTS payment_reference TEXT,
    ADD COLUMN IF NOT EXISTS has_invoice_addon BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS invoice_eligible BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pricing_breakdown JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS billing_details JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS card_config JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_eligible ON public.orders(invoice_eligible);

-- 3. CREATE INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_reference TEXT NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    theme_id TEXT DEFAULT 'midnight_purple',
    custom_accent TEXT DEFAULT '#6B00FF',
    header_style TEXT DEFAULT 'bold_banner',
    pdf_filename TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON public.invoices(customer_email);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own invoices
CREATE POLICY "Customers view own invoices"
    ON public.invoices
    FOR SELECT
    USING (
        auth.uid() = customer_id
        OR auth.jwt() ->> 'email' = customer_email
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin', 'manager', 'editor')
        )
    );

-- Authorized staff can insert and manage invoices
CREATE POLICY "Staff manage invoices"
    ON public.invoices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin', 'manager', 'editor')
        )
        OR auth.uid() = customer_id
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin', 'manager', 'editor')
        )
        OR auth.uid() = customer_id
    );

-- 5. AUDIT LOG EXTENSION
INSERT INTO public.audit_logs (action, entity, details)
VALUES (
    'SCHEMA_MIGRATION',
    'INVOICE_PRINT_ORDER_WORKFLOW',
    'Applied print order payment verification, pricing breakdown, and invoices table migration'
);
