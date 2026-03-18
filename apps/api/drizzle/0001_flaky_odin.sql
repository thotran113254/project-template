CREATE TABLE "pricing_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(30) NOT NULL,
	"option_key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "pricing_options_category_key_idx" ON "pricing_options" USING btree ("category","option_key");--> statement-breakpoint
CREATE INDEX "pricing_options_category_idx" ON "pricing_options" USING btree ("category");