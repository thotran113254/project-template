CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'inactive' NOT NULL,
	"category" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" varchar(255) NOT NULL,
	"star_rating" integer DEFAULT 5 NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_from" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hotel_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"room_type" varchar(100) NOT NULL,
	"price_per_night" integer DEFAULT 0 NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hotel_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"check_in" timestamp with time zone NOT NULL,
	"check_out" timestamp with time zone NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_price" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"category" varchar(100) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"source_url" varchar(1000),
	"source_type" varchar(50),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) DEFAULT 'New Chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid,
	"name" varchar(255) NOT NULL,
	"season_start" timestamp with time zone,
	"season_end" timestamp with time zone,
	"multiplier" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"min_nights" integer DEFAULT 1,
	"admin_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"destination" varchar(200) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"guests" integer DEFAULT 2 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"cover_image" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) DEFAULT '' NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"location" varchar(300) DEFAULT '' NOT NULL,
	"confirmation_code" varchar(50) DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"region" varchar(100),
	"geography" text,
	"season_info" text,
	"weather_info" text,
	"highlights" text,
	"travel_tips" text,
	"local_specialties" jsonb DEFAULT '[]'::jsonb,
	"accommodation_overview" text,
	"visitor_stats" jsonb DEFAULT '{}'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"group_name" varchar(255) NOT NULL,
	"description" text,
	"examples" text,
	"main_channels" text,
	"implementation" text,
	"effectiveness" varchar(50),
	"strengths" text,
	"weaknesses" text,
	"competition_density" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_customer_journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"phase_name" varchar(100),
	"stage_order" integer NOT NULL,
	"stage_name" varchar(255) NOT NULL,
	"customer_actions" text,
	"touchpoints" text,
	"painpoints" text,
	"customer_info_needs" text,
	"business_touchpoints" text,
	"extended_details" text,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_target_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"segment_name" varchar(100) NOT NULL,
	"age_range" varchar(50),
	"gender" varchar(50),
	"occupation" text,
	"income_range" varchar(100),
	"location" text,
	"travel_motivation" text,
	"booking_habits" text,
	"stay_duration" varchar(100),
	"travel_frequency" varchar(100),
	"primary_channels" text,
	"content_interests" text,
	"pain_points" text,
	"preferences" text,
	"trust_factors" text,
	"decision_factors" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_attractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50),
	"position" text,
	"nature_description" text,
	"experience_value" text,
	"popularity" varchar(50),
	"best_time" text,
	"cost_info" text,
	"suitable_for" text,
	"connectivity" text,
	"risks" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_dining_spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"address" text,
	"price_range" varchar(100),
	"price_level" varchar(20),
	"notable_features" text,
	"cuisine_type" varchar(100),
	"operating_hours" varchar(100),
	"contact_info" jsonb DEFAULT '{}'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_transportation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"route_segment" varchar(255) NOT NULL,
	"transport_type" varchar(50) NOT NULL,
	"departure_points" text,
	"arrival_points" text,
	"duration" varchar(100),
	"cost_info" text,
	"convenience_notes" text,
	"package_integration" text,
	"suitable_for" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_inventory_strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"month_range" varchar(50) NOT NULL,
	"season_name" varchar(100),
	"demand_level" varchar(50),
	"price_variation" text,
	"holding_type" varchar(20),
	"target_segment" text,
	"applicable_periods" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"criteria_name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'homestay' NOT NULL,
	"star_rating" numeric(2, 1),
	"address" text,
	"location_detail" text,
	"description" text,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"contact_info" jsonb DEFAULT '{}'::jsonb,
	"invoice_status" varchar(50) DEFAULT 'none' NOT NULL,
	"notes" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"criteria_id" uuid NOT NULL,
	"value" text,
	"notes" text,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"room_type" varchar(255) NOT NULL,
	"booking_code" varchar(50),
	"capacity" integer DEFAULT 2 NOT NULL,
	"description" text,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"combo_type" varchar(20) NOT NULL,
	"day_type" varchar(20) NOT NULL,
	"season_name" varchar(100) DEFAULT 'default' NOT NULL,
	"season_start" date,
	"season_end" date,
	"standard_guests" integer NOT NULL,
	"price" integer NOT NULL,
	"price_plus1" integer,
	"price_minus1" integer,
	"extra_night" integer,
	"notes" text,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid,
	"property_id" uuid,
	"rule_name" varchar(255) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"duration_days" integer NOT NULL,
	"duration_nights" integer NOT NULL,
	"theme" varchar(50),
	"description" text,
	"highlights" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"ai_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"time_of_day" varchar(20) NOT NULL,
	"time_start" varchar(10),
	"time_end" varchar(10),
	"activity" text NOT NULL,
	"location" varchar(255),
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_data_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_category" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_hotel_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."hotel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_competitors" ADD CONSTRAINT "market_competitors_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_customer_journeys" ADD CONSTRAINT "market_customer_journeys_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_target_customers" ADD CONSTRAINT "market_target_customers_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_attractions" ADD CONSTRAINT "market_attractions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_dining_spots" ADD CONSTRAINT "market_dining_spots_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_transportation" ADD CONSTRAINT "market_transportation_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_inventory_strategies" ADD CONSTRAINT "market_inventory_strategies_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_properties" ADD CONSTRAINT "market_properties_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_evaluations" ADD CONSTRAINT "property_evaluations_property_id_market_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."market_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_evaluations" ADD CONSTRAINT "property_evaluations_criteria_id_evaluation_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_rooms" ADD CONSTRAINT "property_rooms_property_id_market_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."market_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_pricing" ADD CONSTRAINT "room_pricing_room_id_property_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."property_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_configs" ADD CONSTRAINT "pricing_configs_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_configs" ADD CONSTRAINT "pricing_configs_property_id_market_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."market_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_templates" ADD CONSTRAINT "itinerary_templates_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_template_items" ADD CONSTRAINT "itinerary_template_items_template_id_itinerary_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."itinerary_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_data_settings" ADD CONSTRAINT "ai_data_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resources_user_id_idx" ON "resources" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "resources_slug_idx" ON "resources" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "hotels_slug_idx" ON "hotels" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "hotels_location_idx" ON "hotels" USING btree ("location");--> statement-breakpoint
CREATE INDEX "hotel_rooms_hotel_id_idx" ON "hotel_rooms" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_hotel_id_idx" ON "bookings" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_base_category_idx" ON "knowledge_base" USING btree ("category");--> statement-breakpoint
CREATE INDEX "knowledge_base_status_idx" ON "knowledge_base" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_base_created_by_idx" ON "knowledge_base" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "pricing_rules_hotel_id_idx" ON "pricing_rules" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "trips_user_id_idx" ON "trips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "itinerary_items_trip_id_idx" ON "itinerary_items" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "itinerary_items_day_number_idx" ON "itinerary_items" USING btree ("trip_id","day_number");--> statement-breakpoint
CREATE UNIQUE INDEX "markets_slug_idx" ON "markets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "market_competitors_market_id_idx" ON "market_competitors" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_customer_journeys_market_id_idx" ON "market_customer_journeys" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_target_customers_market_id_idx" ON "market_target_customers" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_attractions_market_id_idx" ON "market_attractions" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_dining_spots_market_id_idx" ON "market_dining_spots" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_dining_spots_category_idx" ON "market_dining_spots" USING btree ("category");--> statement-breakpoint
CREATE INDEX "market_transportation_market_id_idx" ON "market_transportation" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_inventory_strategies_market_id_idx" ON "market_inventory_strategies" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "evaluation_criteria_market_id_idx" ON "evaluation_criteria" USING btree ("market_id");--> statement-breakpoint
CREATE UNIQUE INDEX "market_properties_market_slug_idx" ON "market_properties" USING btree ("market_id","slug");--> statement-breakpoint
CREATE INDEX "market_properties_market_id_idx" ON "market_properties" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_properties_status_idx" ON "market_properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "market_properties_ai_visible_idx" ON "market_properties" USING btree ("ai_visible");--> statement-breakpoint
CREATE UNIQUE INDEX "property_evaluations_prop_criteria_idx" ON "property_evaluations" USING btree ("property_id","criteria_id");--> statement-breakpoint
CREATE INDEX "property_rooms_property_id_idx" ON "property_rooms" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "room_pricing_room_id_idx" ON "room_pricing" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_pricing_combo_day_season_idx" ON "room_pricing" USING btree ("room_id","combo_type","day_type","season_name");--> statement-breakpoint
CREATE INDEX "pricing_configs_market_id_idx" ON "pricing_configs" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "pricing_configs_property_id_idx" ON "pricing_configs" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "itinerary_templates_market_id_idx" ON "itinerary_templates" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "itinerary_template_items_template_id_idx" ON "itinerary_template_items" USING btree ("template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_data_settings_category_idx" ON "ai_data_settings" USING btree ("data_category");