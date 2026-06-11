CREATE TABLE "drug_products" (
	"barcode" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"active_ingredient" text,
	"atc_code" text,
	"updated_at" text NOT NULL
);
