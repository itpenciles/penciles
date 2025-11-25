To manually update your database schema, run the following SQL commands in your database client (e.g., pgAdmin, psql, or TablePlus):

-- 1. Ensure ALL feature columns exist (including the deprecated one)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS can_compare BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_export_csv BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_use_advanced_strategies BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_wholesale BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_subject_to BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_seller_finance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_brrrr BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_access_comparables BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_access_projections BOOLEAN DEFAULT FALSE;

-- 2. Set defaults based on Plan Key (Safe to run multiple times)

-- Pro, Team, PayAsYouGo get EVERYTHING
UPDATE plans 
SET 
    can_compare = TRUE,
    can_export_csv = TRUE,
    can_use_advanced_strategies = TRUE,
    can_wholesale = TRUE,
    can_subject_to = TRUE,
    can_seller_finance = TRUE,
    can_brrrr = TRUE,
    can_access_comparables = TRUE, 
    can_access_projections = TRUE 
WHERE key IN ('Pro', 'Team', 'PayAsYouGo');

-- Experienced gets Comparables, Projections, Export, Compare
UPDATE plans 
SET 
    can_compare = TRUE,
    can_export_csv = TRUE,
    can_access_comparables = TRUE,
    can_access_projections = TRUE
WHERE key = 'Experienced';

-- Starter gets Compare, Comparables (limited)
UPDATE plans 
SET 
    can_compare = TRUE,
    can_access_comparables = TRUE 
WHERE key = 'Starter';
