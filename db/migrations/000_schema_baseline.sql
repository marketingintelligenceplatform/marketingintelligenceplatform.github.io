-- Baseline captured from the existing MIP PostgreSQL schema.
-- This migration is for new environments only. Existing environments use
-- `npm run db:baseline` to record it without changing their tables.
-- Create a new numbered migration for every future schema change.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "organizations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "industry" character varying(100),
  "country" character varying(100),
  "timezone" character varying(100),
  "currency" character varying(20),
  "subscription_plan" character varying(50) DEFAULT 'Free'::character varying,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY (id),
  CONSTRAINT "organizations_name_key" UNIQUE (name)
);

CREATE TABLE "users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "first_name" character varying(100) NOT NULL,
  "last_name" character varying(100),
  "email" character varying(255) NOT NULL,
  "password_hash" text NOT NULL,
  "phone" character varying(30),
  "is_active" boolean DEFAULT true,
  "last_login" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_users_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_email_key" UNIQUE (email)
);

CREATE TABLE "roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" character varying(100) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_roles_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "roles_pkey" PRIMARY KEY (id),
  CONSTRAINT "unique_role_per_organization" UNIQUE (organization_id, name)
);

CREATE TABLE "organization_users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "is_active" boolean DEFAULT true,
  "joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_organization_users_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "fk_organization_users_role" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  CONSTRAINT "fk_organization_users_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT "organization_users_pkey" PRIMARY KEY (id),
  CONSTRAINT "unique_user_per_organization" UNIQUE (organization_id, user_id)
);

CREATE TABLE "pipeline_stages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" character varying(100) NOT NULL,
  "stage_order" integer NOT NULL,
  "color" character varying(20),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_pipeline_stages_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY (id),
  CONSTRAINT "unique_stage_order_per_organization" UNIQUE (organization_id, stage_order),
  CONSTRAINT "unique_stage_per_organization" UNIQUE (organization_id, name)
);

CREATE TABLE "campaigns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "description" text,
  "campaign_type" character varying(100),
  "start_date" date,
  "end_date" date,
  "budget" numeric(15,2),
  "status" character varying(50) DEFAULT 'Draft'::character varying,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_campaigns_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY (id)
);

CREATE TABLE "leads" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "pipeline_stage_id" uuid NOT NULL,
  "assigned_user_id" uuid,
  "first_name" character varying(100) NOT NULL,
  "last_name" character varying(100),
  "company_name" character varying(255),
  "email" character varying(255),
  "phone" character varying(30),
  "source" character varying(100),
  "estimated_value" numeric(15,2),
  "notes" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_leads_assigned_user" FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT "fk_leads_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "fk_leads_pipeline_stage" FOREIGN KEY (pipeline_stage_id) REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  CONSTRAINT "leads_pkey" PRIMARY KEY (id)
);

CREATE TABLE "activities" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "activity_type" character varying(100) NOT NULL,
  "description" text,
  "activity_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_activities_lead" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT "fk_activities_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "fk_activities_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT "activities_pkey" PRIMARY KEY (id)
);

CREATE TABLE "followups" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "assigned_user_id" uuid NOT NULL,
  "title" character varying(255) NOT NULL,
  "description" text,
  "due_date" timestamp with time zone NOT NULL,
  "status" character varying(50) DEFAULT 'Pending'::character varying,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_followups_assigned_user" FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT "fk_followups_lead" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT "fk_followups_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "followups_pkey" PRIMARY KEY (id)
);

CREATE TABLE "lead_stage_history" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "pipeline_stage_id" uuid NOT NULL,
  "changed_by_user_id" uuid NOT NULL,
  "entered_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "exited_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_history_changed_by" FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT "fk_history_lead" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT "fk_history_organization" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT "fk_history_stage" FOREIGN KEY (pipeline_stage_id) REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  CONSTRAINT "lead_stage_history_pkey" PRIMARY KEY (id)
);
