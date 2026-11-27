CREATE TYPE "public"."curation_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "curations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"layout_code" text NOT NULL,
	"data" jsonb NOT NULL,
	"status" "curation_status" DEFAULT 'draft' NOT NULL,
	"has_unpublished_changes" boolean DEFAULT true NOT NULL,
	"published_data" jsonb,
	"updated_by_email" text,
	"published_by_email" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curations_layout_code_unique" UNIQUE("layout_code")
);
--> statement-breakpoint
CREATE INDEX "curations_status_idx" ON "curations" USING btree ("status");