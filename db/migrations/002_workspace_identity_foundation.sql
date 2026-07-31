-- Workspace-first identity foundation.
-- This migration is forward-only: it preserves existing CRM data while moving
-- authentication to global users and authorization to organization memberships.

CREATE EXTENSION IF NOT EXISTS citext;

-- A person is global. Existing organization memberships remain the source of
-- workspace access while the legacy column is kept temporarily for backwards
-- compatible reads during the rollout.
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email TYPE citext USING email::citext;

-- Workspace profile and onboarding state. A workspace name is display data;
-- the slug is the stable globally-addressable identifier.
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_name_key;
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug varchar(100),
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

UPDATE organizations
SET slug = COALESCE(
  NULLIF(regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'), ''),
  'workspace'
) || '-' || left(replace(id::text, '-', ''), 8)
WHERE slug IS NULL;

ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);

-- Membership is the tenant-scoped authorization boundary.
ALTER TABLE organization_users
  ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

UPDATE organization_users
SET status = CASE WHEN is_active THEN 'active' ELSE 'suspended' END,
    activated_at = COALESCE(activated_at, joined_at)
WHERE status = 'active' OR activated_at IS NULL;

ALTER TABLE organization_users
  ADD CONSTRAINT organization_users_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'left'));

CREATE INDEX IF NOT EXISTS idx_organization_users_user_organization
  ON organization_users (user_id, organization_id)
  WHERE is_active = TRUE AND status = 'active';

-- Role assignment must belong to the same workspace as the membership.
ALTER TABLE roles
  ADD CONSTRAINT roles_organization_id_id_key UNIQUE (organization_id, id);

ALTER TABLE organization_users
  ADD CONSTRAINT organization_users_role_workspace_fkey
  FOREIGN KEY (organization_id, role_id)
  REFERENCES roles (organization_id, id)
  ON DELETE RESTRICT;

-- Sessions authenticate a user. active_organization_id is only the user's
-- last selected workspace; each request still validates an active membership.
ALTER TABLE sessions RENAME COLUMN organization_id TO active_organization_id;
ALTER TABLE sessions ALTER COLUMN active_organization_id DROP NOT NULL;
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_sessions_user_active
  ON sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expiry
  ON sessions (expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email citext NOT NULL,
  role_id uuid NOT NULL,
  invited_by_membership_id uuid NOT NULL REFERENCES organization_users(id) ON DELETE RESTRICT,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workspace_invitations_role_workspace_fkey
    FOREIGN KEY (organization_id, role_id)
    REFERENCES roles (organization_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT workspace_invitations_expiry_check CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX workspace_invitations_pending_email_key
  ON workspace_invitations (organization_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX idx_workspace_invitations_token_expiry
  ON workspace_invitations (token_hash, expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Notifications, email, integrations, AI jobs, and analytics all use this
-- transactional hand-off instead of performing external work in HTTP routes.
CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_type varchar(120) NOT NULL,
  aggregate_type varchar(80) NOT NULL,
  aggregate_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  available_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_outbox_events_pending
  ON outbox_events (available_at, created_at)
  WHERE processed_at IS NULL;

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES organization_users(id) ON DELETE SET NULL,
  event_type varchar(120) NOT NULL,
  entity_type varchar(80),
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_events_workspace_created
  ON audit_events (organization_id, created_at DESC);
