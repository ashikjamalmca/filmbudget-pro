-- ─────────────────────────────────────────────────────────────────────────────
-- 004_remuneration.sql
-- Unified Remuneration Management: replaces separate artists / music_expenses
-- tables for new entries while leaving old data intact.
-- Run this in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. remuneration_entries ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.remuneration_entries (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        uuid        REFERENCES public.tenants(id)   ON DELETE CASCADE,
  project_id       uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  department       text        NOT NULL,
  role             text        NOT NULL DEFAULT '',
  person_name      text        NOT NULL,
  item_service     text,
  agreed_amount    numeric(14,2) NOT NULL DEFAULT 0,
  paid_amount      numeric(14,2) NOT NULL DEFAULT 0,
  balance_amount   numeric(14,2) GENERATED ALWAYS AS (agreed_amount - paid_amount) STORED,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'partial', 'complete')),
  paid_by          text,
  payment_date     date,
  remarks          text,
  created_by       uuid        REFERENCES public.profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 2. remuneration_payments (payment history log) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.remuneration_payments (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  remuneration_id  uuid        NOT NULL REFERENCES public.remuneration_entries(id) ON DELETE CASCADE,
  tenant_id        uuid        REFERENCES public.tenants(id)   ON DELETE CASCADE,
  amount           numeric(14,2) NOT NULL,
  payment_date     date        NOT NULL DEFAULT CURRENT_DATE,
  paid_by          text,
  remarks          text,
  expense_id       uuid        REFERENCES public.daily_expenses(id) ON DELETE SET NULL,
  created_by       uuid        REFERENCES public.profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Link daily_expenses → remuneration_entries (optional) ─────────────────
ALTER TABLE public.daily_expenses
  ADD COLUMN IF NOT EXISTS remuneration_entry_id uuid
    REFERENCES public.remuneration_entries(id) ON DELETE SET NULL;

-- ── 4. updated_at helper function (create if not already present) ─────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 5. updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER remuneration_entries_updated_at
  BEFORE UPDATE ON public.remuneration_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 6. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.remuneration_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneration_payments ENABLE ROW LEVEL SECURITY;

-- remuneration_entries
CREATE POLICY "tenant_select_remuneration_entries" ON public.remuneration_entries
  FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "tenant_insert_remuneration_entries" ON public.remuneration_entries
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_update_remuneration_entries" ON public.remuneration_entries
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_delete_remuneration_entries" ON public.remuneration_entries
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- remuneration_payments
CREATE POLICY "tenant_select_remuneration_payments" ON public.remuneration_payments
  FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "tenant_insert_remuneration_payments" ON public.remuneration_payments
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_delete_remuneration_payments" ON public.remuneration_payments
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- ── 7. Helpful indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_remuneration_entries_project  ON public.remuneration_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_remuneration_entries_tenant   ON public.remuneration_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_remuneration_payments_entry   ON public.remuneration_payments(remuneration_id);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_remuneration   ON public.daily_expenses(remuneration_entry_id)
  WHERE remuneration_entry_id IS NOT NULL;
