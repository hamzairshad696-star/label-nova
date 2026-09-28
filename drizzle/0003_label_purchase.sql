CREATE SEQUENCE "public"."label_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "pricing_rule_id" uuid;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "price_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "label_number" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_service_id_carrier_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."carrier_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pricing_rule_id_pricing_rules_id_fk" FOREIGN KEY ("pricing_rule_id") REFERENCES "public"."pricing_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_label_number_idx" ON "shipments" USING btree ("label_number");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_idempotency_idx" ON "shipments" USING btree ("idempotency_key");