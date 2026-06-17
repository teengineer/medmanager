CREATE TABLE "supplement_products" (
	"id" text PRIMARY KEY NOT NULL,
	"barcode" text,
	"name" text NOT NULL,
	"form" text,
	"usage_count" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplement_products" ADD CONSTRAINT "supplement_products_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "supplement_products_barcode_unique" ON "supplement_products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "supplement_products_name" ON "supplement_products" USING btree ("name");