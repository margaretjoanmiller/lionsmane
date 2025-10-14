CREATE TABLE "feed_host" (
	"id" uuid PRIMARY KEY NOT NULL,
	"url" text,
	"robotsTxt" text,
	CONSTRAINT "feed_host_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "feed_host" uuid;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_feed_host_feed_host_id_fk" FOREIGN KEY ("feed_host") REFERENCES "public"."feed_host"("id") ON DELETE no action ON UPDATE no action;