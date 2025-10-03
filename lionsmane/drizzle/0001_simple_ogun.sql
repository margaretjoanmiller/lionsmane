CREATE TABLE "icons" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(256) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"type" varchar(256) NOT NULL,
	CONSTRAINT "icons_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "updated" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "icon" integer;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_icon_icons_id_fk" FOREIGN KEY ("icon") REFERENCES "public"."icons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "favicon";