-- Migration 006: Budget Allocations
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.budget_allocations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tenant_id        uuid        REFERENCES public.tenants(id) ON DELETE CASCADE,
  department       text        NOT NULL,
  allocated_amount numeric(15,2) NOT NULL DEFAULT 0,
  notes            text,
  sort_order       int         DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_allocations_project ON public.budget_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_tenant  ON public.budget_allocations(tenant_id);

CREATE OR REPLACE TRIGGER budget_allocations_updated_at
  BEFORE UPDATE ON public.budget_allocations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_super_admin" ON public.budget_allocations
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "budget_tenant_select" ON public.budget_allocations
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "budget_tenant_insert" ON public.budget_allocations
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "budget_tenant_update" ON public.budget_allocations
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "budget_tenant_delete" ON public.budget_allocations
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());
