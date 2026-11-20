CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"selected_vehicle_id" uuid,
	"notify_reminders" boolean DEFAULT true NOT NULL,
	"notify_push" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "plate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "version" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_displacement" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "fuel" "fuel_type";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_air_conditioning" boolean;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_selected_vehicle_id_vehicles_id_fk" FOREIGN KEY ("selected_vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;