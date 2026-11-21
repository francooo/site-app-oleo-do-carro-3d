CREATE TABLE "plate_lookup_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plate" text NOT NULL,
	"plate_lookup_id" uuid,
	"source" text NOT NULL,
	"outcome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plate_lookups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate" text NOT NULL,
	"provider" text NOT NULL,
	"provider_lookup_id" text,
	"request_id" text,
	"result" text NOT NULL,
	"make" text,
	"model" text,
	"version" text,
	"manufacture_year" integer,
	"model_year" integer,
	"fuel" "fuel_type",
	"engine_displacement" text,
	"fipe_code" text,
	"fipe_versions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plate_lookups_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "fipe_code" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "plate_lookup_id" uuid;--> statement-breakpoint
ALTER TABLE "plate_lookup_attempts" ADD CONSTRAINT "plate_lookup_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plate_lookup_attempts" ADD CONSTRAINT "plate_lookup_attempts_plate_lookup_id_plate_lookups_id_fk" FOREIGN KEY ("plate_lookup_id") REFERENCES "public"."plate_lookups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plate_lookup_attempts_user_created_idx" ON "plate_lookup_attempts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "plate_lookup_attempts_created_idx" ON "plate_lookup_attempts" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_plate_lookup_id_plate_lookups_id_fk" FOREIGN KEY ("plate_lookup_id") REFERENCES "public"."plate_lookups"("id") ON DELETE set null ON UPDATE no action;