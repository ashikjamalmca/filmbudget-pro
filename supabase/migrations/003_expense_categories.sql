-- ============================================================
-- Migration 003: Expense Categories + Daily Expenses enhancements
-- ============================================================

-- 1. expense_categories table
--    tenant_id IS NULL  → global (super admin managed)
--    tenant_id IS NOT NULL → producer-specific (scoped to tenant)
--    parent_id IS NULL  → top-level category
--    parent_id IS NOT NULL → subcategory
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
  sort_order  INT  NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant ON expense_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_id);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- SELECT: see global OR own tenant categories
CREATE POLICY "ec_select" ON expense_categories
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id = public.get_user_tenant_id()
    OR public.is_super_admin()
  );

-- INSERT: super admin for globals; producers for own tenant
CREATE POLICY "ec_insert" ON expense_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    (tenant_id IS NULL AND public.is_super_admin())
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
  );

-- UPDATE: super admin for globals; producers for own tenant
CREATE POLICY "ec_update" ON expense_categories
  FOR UPDATE TO authenticated
  USING (
    (tenant_id IS NULL AND public.is_super_admin())
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
  );

-- DELETE: super admin for globals; producers for own tenant
CREATE POLICY "ec_delete" ON expense_categories
  FOR DELETE TO authenticated
  USING (
    (tenant_id IS NULL AND public.is_super_admin())
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
  );


-- 2. New columns on daily_expenses
-- ============================================================
ALTER TABLE daily_expenses
  ADD COLUMN IF NOT EXISTS paid_by       TEXT,
  ADD COLUMN IF NOT EXISTS description   TEXT,
  ADD COLUMN IF NOT EXISTS category_id   UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL;


-- 3. Seed global default categories (top-level)
-- ============================================================
INSERT INTO expense_categories (name, tenant_id, parent_id, sort_order) VALUES
  ('Production',       NULL, NULL, 10),
  ('Logistics',        NULL, NULL, 20),
  ('Crew & Cast',      NULL, NULL, 30),
  ('Equipment',        NULL, NULL, 40),
  ('Post Production',  NULL, NULL, 50),
  ('Administration',   NULL, NULL, 60),
  ('Marketing',        NULL, NULL, 70),
  ('Others',           NULL, NULL, 80)
ON CONFLICT DO NOTHING;


-- 4. Seed subcategories for global categories
-- ============================================================
DO $$
DECLARE
  prod_id  UUID;
  logi_id  UUID;
  crew_id  UUID;
  equip_id UUID;
  post_id  UUID;
  admin_id UUID;
  mktg_id  UUID;
  othr_id  UUID;
BEGIN
  SELECT id INTO prod_id  FROM expense_categories WHERE name='Production'      AND tenant_id IS NULL AND parent_id IS NULL;
  SELECT id INTO logi_id  FROM expense_categories WHERE name='Logistics'       AND tenant_id IS NULL AND parent_id IS NULL;
  SELECT id INTO crew_id  FROM expense_categories WHERE name='Crew & Cast'     AND tenant_id IS NULL AND parent_id IS NULL;
  SELECT id INTO equip_id FROM expense_categories WHERE name='Equipment'       AND tenant_id IS NULL AND parent_id IS NULL;
  SELECT id INTO post_id  FROM expense_categories WHERE name='Post Production' AND tenant_id IS NULL AND parent_id IS NULL;
  SELECT id INTO admin_id FROM expense_categories WHERE name='Administration'  AND tenant_id IS NULL AND parent_id IS NULL;
  SELECT id INTO mktg_id  FROM expense_categories WHERE name='Marketing'       AND tenant_id IS NULL AND parent_id IS NULL;
  SELECT id INTO othr_id  FROM expense_categories WHERE name='Others'          AND tenant_id IS NULL AND parent_id IS NULL;

  INSERT INTO expense_categories (name, tenant_id, parent_id, sort_order) VALUES
    -- Production
    ('Location Fee',         NULL, prod_id,  1),
    ('Set Construction',     NULL, prod_id,  2),
    ('Props',                NULL, prod_id,  3),
    ('Costumes',             NULL, prod_id,  4),
    ('Lighting Setup',       NULL, prod_id,  5),
    ('Shooting Allowance',   NULL, prod_id,  6),
    -- Logistics
    ('Lodging',              NULL, logi_id,  1),
    ('Vehicles',             NULL, logi_id,  2),
    ('Air / Train Tickets',  NULL, logi_id,  3),
    ('Mess (Meals)',         NULL, logi_id,  4),
    ('Fuel',                 NULL, logi_id,  5),
    -- Crew & Cast
    ('Batta (Daily Allowance)', NULL, crew_id, 1),
    ('Overtime',             NULL, crew_id,  2),
    ('Advance',              NULL, crew_id,  3),
    ('Remuneration',         NULL, crew_id,  4),
    -- Equipment
    ('Equipment Rental',     NULL, equip_id, 1),
    ('Generator Rental',     NULL, equip_id, 2),
    ('Camera Equipment',     NULL, equip_id, 3),
    ('Sound Equipment',      NULL, equip_id, 4),
    -- Post Production
    ('Editing',              NULL, post_id,  1),
    ('VFX / CGI',            NULL, post_id,  2),
    ('Sound Mixing',         NULL, post_id,  3),
    ('Color Grading',        NULL, post_id,  4),
    ('DCP / Output',         NULL, post_id,  5),
    -- Administration
    ('Office Expenses',      NULL, admin_id, 1),
    ('Legal & Permits',      NULL, admin_id, 2),
    ('Insurance',            NULL, admin_id, 3),
    ('Bank Charges',         NULL, admin_id, 4),
    -- Marketing
    ('Publicity',            NULL, mktg_id,  1),
    ('Digital Marketing',    NULL, mktg_id,  2),
    ('Press & Media',        NULL, mktg_id,  3),
    -- Others
    ('Miscellaneous',        NULL, othr_id,  1),
    ('Contingency',          NULL, othr_id,  2)
  ON CONFLICT DO NOTHING;
END $$;
