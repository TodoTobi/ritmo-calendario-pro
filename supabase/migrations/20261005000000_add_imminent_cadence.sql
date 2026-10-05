-- Migration: Add 'imminent' value to alert_cadence enum
DO $$ BEGIN
    ALTER TYPE alert_cadence ADD VALUE IF NOT EXISTS 'imminent';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
