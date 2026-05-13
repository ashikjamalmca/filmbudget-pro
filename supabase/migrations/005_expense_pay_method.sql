-- Migration 005: Add pay_method and reference_no to daily_expenses
-- Run this in the Supabase SQL Editor.

ALTER TABLE public.daily_expenses
  ADD COLUMN IF NOT EXISTS pay_method   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reference_no TEXT DEFAULT NULL;
