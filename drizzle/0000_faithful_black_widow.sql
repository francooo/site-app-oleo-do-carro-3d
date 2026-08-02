CREATE TYPE "public"."aspiration" AS ENUM('naturally_aspirated', 'turbo', 'supercharged', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."engine_match_status" AS ENUM('unmatched', 'pending_disambiguation', 'confirmed', 'manual_override');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('gasoline', 'ethanol', 'flex', 'diesel', 'hybrid', 'electric');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('manual', 'licensed_db', 'catalog', 'curated');--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "component_types" (
	"code" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engine_id" uuid NOT NULL,
	"component_type" text NOT NULL,
	"oem_code" text,
	"cross_references" jsonb,
	"interval_km" integer,
	"source_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maintenance_record_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engine_fluids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engine_id" uuid NOT NULL,
	"fluid_type" text NOT NULL,
	"specification" text NOT NULL,
	"viscosity" text,
	"volume_ml" integer,
	"volume_with_filter_ml" integer,
	"interval_km" integer,
	"interval_months" integer,
	"source_id" uuid NOT NULL,
	"warnings" text
);
--> statement-breakpoint
CREATE TABLE "engine_layout_hotspots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"layout_id" uuid NOT NULL,
	"component_type" text NOT NULL,
	"x" numeric(5, 2) NOT NULL,
	"y" numeric(5, 2) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "engine_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"image_storage_path" text,
	"description" text,
	CONSTRAINT "engine_layouts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "engines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"displacement" numeric(3, 1),
	"cylinders" integer,
	"fuel_type" "fuel_type" NOT NULL,
	"layout_id" uuid,
	"aspiration" "aspiration",
	"notes" text,
	CONSTRAINT "engines_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fluid_types" (
	"code" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"km" integer NOT NULL,
	"service_type" text NOT NULL,
	"workshop" text,
	"parts" jsonb,
	"total_value" numeric(10, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "source_type" NOT NULL,
	"reference" text,
	"verified_at" timestamp with time zone,
	"verified_by" text
);
--> statement-breakpoint
CREATE TABLE "trim_engine_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trim_engine_map_id" uuid NOT NULL,
	"engine_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "trim_engine_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year_from" integer NOT NULL,
	"year_to" integer NOT NULL,
	"trim_label" text,
	"fuel_type" "fuel_type",
	"disambiguation_hint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"password_hash" text,
	"accepted_terms_at" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plate" text NOT NULL,
	"vin" text,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"trim" text,
	"engine_id" uuid,
	"engine_match_status" "engine_match_status" DEFAULT 'unmatched' NOT NULL,
	"pending_trim_engine_map_id" uuid,
	"current_km" integer,
	"km_updated_at" timestamp with time zone,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_user_plate_unique" UNIQUE("user_id","plate")
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_engine_id_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."engines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_component_type_component_types_code_fk" FOREIGN KEY ("component_type") REFERENCES "public"."component_types"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_maintenance_record_id_maintenance_records_id_fk" FOREIGN KEY ("maintenance_record_id") REFERENCES "public"."maintenance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engine_fluids" ADD CONSTRAINT "engine_fluids_engine_id_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."engines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engine_fluids" ADD CONSTRAINT "engine_fluids_fluid_type_fluid_types_code_fk" FOREIGN KEY ("fluid_type") REFERENCES "public"."fluid_types"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engine_fluids" ADD CONSTRAINT "engine_fluids_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engine_layout_hotspots" ADD CONSTRAINT "engine_layout_hotspots_layout_id_engine_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."engine_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engine_layout_hotspots" ADD CONSTRAINT "engine_layout_hotspots_component_type_component_types_code_fk" FOREIGN KEY ("component_type") REFERENCES "public"."component_types"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engines" ADD CONSTRAINT "engines_layout_id_engine_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."engine_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trim_engine_candidates" ADD CONSTRAINT "trim_engine_candidates_trim_engine_map_id_trim_engine_map_id_fk" FOREIGN KEY ("trim_engine_map_id") REFERENCES "public"."trim_engine_map"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trim_engine_candidates" ADD CONSTRAINT "trim_engine_candidates_engine_id_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."engines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_engine_id_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."engines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_pending_trim_engine_map_id_trim_engine_map_id_fk" FOREIGN KEY ("pending_trim_engine_map_id") REFERENCES "public"."trim_engine_map"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "components_engine_id_idx" ON "components" USING btree ("engine_id");--> statement-breakpoint
CREATE INDEX "engine_fluids_engine_id_idx" ON "engine_fluids" USING btree ("engine_id");--> statement-breakpoint
CREATE INDEX "maintenance_records_vehicle_id_idx" ON "maintenance_records" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "trim_engine_map_make_model_year_idx" ON "trim_engine_map" USING btree ("make","model","year_from","year_to");--> statement-breakpoint
CREATE INDEX "vehicles_user_id_idx" ON "vehicles" USING btree ("user_id");