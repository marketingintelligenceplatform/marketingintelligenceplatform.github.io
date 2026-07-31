-- Application features built on top of the captured baseline schema.
-- This migration is additive and can be safely applied to a new baseline database.

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS permissions text[] NOT NULL DEFAULT '{}';

ALTER TABLE pipeline_stages
  ADD COLUMN IF NOT EXISTS win_probability numeric(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS channel varchar(100),
  ADD COLUMN IF NOT EXISTS spent numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impressions integer NOT NULL DEFAULT 0;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_score integer NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100);

ALTER TABLE followups
  ADD COLUMN IF NOT EXISTS followup_type varchar(50) NOT NULL DEFAULT 'Call',
  ADD COLUMN IF NOT EXISTS priority varchar(20) NOT NULL DEFAULT 'Medium';

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  type varchar(20) NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_organization_created_at ON leads (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_created_at ON notifications (organization_id, created_at DESC);
