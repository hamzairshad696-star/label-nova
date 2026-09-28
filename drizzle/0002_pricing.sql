CREATE TYPE "public"."service_kind" AS ENUM('carrier_postage', 'label_only');--> statement-breakpoint
CREATE TABLE "carrier_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carrier_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"kind" "service_kind" NOT NULL,
	"transit_min_days" integer,
	"transit_max_days" integer,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carrier_services_transit_valid" CHECK ("carrier_services"."transit_min_days" is null or "carrier_services"."transit_max_days" is null or "carrier_services"."transit_max_days" >= "carrier_services"."transit_min_days")
);
--> statement-breakpoint
CREATE TABLE "carriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carriers_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "pricing_rule_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"weight_min_oz" integer NOT NULL,
	"weight_max_oz" integer NOT NULL,
	"zone" integer,
	"cost_cents" bigint,
	"customer_cents" bigint NOT NULL,
	"dealer_cents" bigint NOT NULL,
	"reseller_cents" bigint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_rules_weight_valid" CHECK ("pricing_rules"."weight_min_oz" >= 1 and "pricing_rules"."weight_max_oz" >= "pricing_rules"."weight_min_oz" and "pricing_rules"."weight_max_oz" <= 2400),
	CONSTRAINT "pricing_rules_zone_valid" CHECK ("pricing_rules"."zone" is null or "pricing_rules"."zone" between 1 and 9),
	CONSTRAINT "pricing_rules_prices_positive" CHECK ("pricing_rules"."customer_cents" > 0 and "pricing_rules"."dealer_cents" > 0 and "pricing_rules"."reseller_cents" > 0 and ("pricing_rules"."cost_cents" is null or "pricing_rules"."cost_cents" >= 0))
);
--> statement-breakpoint
ALTER TABLE "carrier_services" ADD CONSTRAINT "carrier_services_carrier_id_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rule_changes" ADD CONSTRAINT "pricing_rule_changes_rule_id_pricing_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."pricing_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rule_changes" ADD CONSTRAINT "pricing_rule_changes_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_service_id_carrier_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."carrier_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "carrier_services_carrier_key_idx" ON "carrier_services" USING btree ("carrier_id","key");--> statement-breakpoint
CREATE INDEX "pricing_rule_changes_rule_idx" ON "pricing_rule_changes" USING btree ("rule_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pricing_rule_changes_created_idx" ON "pricing_rule_changes" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pricing_rules_lookup_idx" ON "pricing_rules" USING btree ("service_id","active","weight_min_oz");--> statement-breakpoint
-- Generic guard for audit tables: rows can be added, never changed or removed.
CREATE OR REPLACE FUNCTION "forbid_row_modification"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "pricing_rule_changes_no_update_delete" BEFORE UPDATE OR DELETE ON "pricing_rule_changes"
  FOR EACH ROW EXECUTE FUNCTION "forbid_row_modification"();--> statement-breakpoint
CREATE TRIGGER "pricing_rule_changes_no_truncate" BEFORE TRUNCATE ON "pricing_rule_changes"
  FOR EACH STATEMENT EXECUTE FUNCTION "forbid_row_modification"();--> statement-breakpoint
-- Pricing rules are deactivated, never deleted.
CREATE TRIGGER "pricing_rules_no_delete" BEFORE DELETE ON "pricing_rules"
  FOR EACH ROW EXECUTE FUNCTION "forbid_row_modification"();
