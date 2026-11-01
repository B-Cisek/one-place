CREATE TABLE "todo_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"widget_id" uuid NOT NULL,
	"text" varchar(500) NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"position" text COLLATE "C" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_widget_id_widgets_id_fk" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todo_items_widget_id_position_idx" ON "todo_items" USING btree ("widget_id","position");