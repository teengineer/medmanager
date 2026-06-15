ALTER TABLE "medicines" ADD COLUMN "package_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD COLUMN "count" integer DEFAULT 1 NOT NULL;