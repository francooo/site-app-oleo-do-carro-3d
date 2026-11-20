CREATE TYPE "public"."check_result" AS ENUM('ok', 'baixo_completei', 'baixo_nao_completei');--> statement-breakpoint
CREATE TYPE "public"."maintenance_kind" AS ENUM('verificacao', 'complemento', 'troca', 'servico');--> statement-breakpoint
ALTER TABLE "engine_layout_hotspots" ALTER COLUMN "component_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "km" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "engine_fluids" ADD COLUMN "volume_with_ac_ml" integer;--> statement-breakpoint
ALTER TABLE "engine_fluids" ADD COLUMN "check_interval_km" integer;--> statement-breakpoint
ALTER TABLE "engine_layout_hotspots" ADD COLUMN "fluid_type" text;--> statement-breakpoint
ALTER TABLE "fluid_types" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "kind" "maintenance_kind" DEFAULT 'servico' NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "fluid_type" text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "check_result" "check_result";--> statement-breakpoint
ALTER TABLE "engine_layout_hotspots" ADD CONSTRAINT "engine_layout_hotspots_fluid_type_fluid_types_code_fk" FOREIGN KEY ("fluid_type") REFERENCES "public"."fluid_types"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_fluid_type_fluid_types_code_fk" FOREIGN KEY ("fluid_type") REFERENCES "public"."fluid_types"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maintenance_records_vehicle_fluid_idx" ON "maintenance_records" USING btree ("vehicle_id","fluid_type","date");--> statement-breakpoint
ALTER TABLE "engine_layout_hotspots" ADD CONSTRAINT "engine_layout_hotspots_target_check" CHECK (("engine_layout_hotspots"."component_type" is null) <> ("engine_layout_hotspots"."fluid_type" is null));