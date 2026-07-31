-- The legacy notifications table predates the UUID tenant schema. CREATE TABLE
-- IF NOT EXISTS in migration 001 preserved its varchar identifiers, so repair
-- the existing table in place instead of creating a parallel notification path.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE notifications
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN organization_id DROP DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM notifications notification
    LEFT JOIN organizations organization
      ON organization.id = CASE
        WHEN notification.organization_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN notification.organization_id::text::uuid
        ELSE NULL
      END
    WHERE organization.id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot migrate notifications.organization_id to UUID because one or more notifications are not linked to an existing workspace.';
  END IF;
END $$;

ALTER TABLE notifications
  ALTER COLUMN id TYPE uuid
    USING CASE
      WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN id::text::uuid
      ELSE gen_random_uuid()
    END,
  ALTER COLUMN organization_id TYPE uuid
    USING organization_id::text::uuid;

UPDATE notifications
SET type = COALESCE(type, 'info'),
    is_read = COALESCE(is_read, FALSE),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP);

ALTER TABLE notifications
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN organization_id SET NOT NULL,
  ALTER COLUMN type SET DEFAULT 'info',
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN is_read SET DEFAULT FALSE,
  ALTER COLUMN is_read SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'notifications'::regclass
      AND contype = 'f'
      AND confrelid = 'organizations'::regclass
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_organization_created_at
  ON notifications (organization_id, created_at DESC);
