CREATE TYPE "public"."shipment_status" AS ENUM('draft', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ledger_kind" AS ENUM('top_up', 'label_charge', 'refund', 'adjustment');--> statement-breakpoint
CREATE TABLE "shipment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"status" "shipment_status" NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"source" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"reference" text,
	"status" "shipment_status" DEFAULT 'draft' NOT NULL,
	"from_address" jsonb,
	"to_address" jsonb,
	"weight_oz" integer,
	"length_in" integer,
	"width_in" integer,
	"height_in" integer,
	"carrier" text,
	"service" text,
	"tracking_number" text,
	"price_cents" bigint,
	"currency" text DEFAULT 'USD' NOT NULL,
	"label_created_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "ledger_kind" NOT NULL,
	"amount_cents" bigint NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"shipment_id" uuid,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_ref" text,
	"note" text,
	"created_by_user_id" uuid,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_ledger_amount_nonzero" CHECK ("wallet_ledger"."amount_cents" <> 0),
	CONSTRAINT "wallet_ledger_sign_matches_kind" CHECK (("wallet_ledger"."kind" = 'top_up' and "wallet_ledger"."amount_cents" > 0) or ("wallet_ledger"."kind" = 'label_charge' and "wallet_ledger"."amount_cents" < 0) or ("wallet_ledger"."kind" = 'refund' and "wallet_ledger"."amount_cents" > 0) or "wallet_ledger"."kind" = 'adjustment')
);
--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shipment_events_shipment_idx" ON "shipment_events" USING btree ("shipment_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "shipments_owner_created_idx" ON "shipments" USING btree ("owner_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "shipments_owner_status_idx" ON "shipments" USING btree ("owner_user_id","status");--> statement-breakpoint
CREATE INDEX "shipments_tracking_idx" ON "shipments" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "wallet_ledger_user_created_idx" ON "wallet_ledger" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_ledger_idempotency_idx" ON "wallet_ledger" USING btree ("idempotency_key");--> statement-breakpoint
-- The ledger is append-only: corrections are new "adjustment" or "refund" rows, never edits.
CREATE OR REPLACE FUNCTION "wallet_ledger_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'wallet_ledger is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "wallet_ledger_no_update_delete" BEFORE UPDATE OR DELETE ON "wallet_ledger"
  FOR EACH ROW EXECUTE FUNCTION "wallet_ledger_append_only"();--> statement-breakpoint
CREATE TRIGGER "wallet_ledger_no_truncate" BEFORE TRUNCATE ON "wallet_ledger"
  FOR EACH STATEMENT EXECUTE FUNCTION "wallet_ledger_append_only"();
