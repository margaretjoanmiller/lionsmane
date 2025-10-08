CREATE TABLE "enclosures" (
	"id" serial PRIMARY KEY NOT NULL,
	"articleId" integer NOT NULL,
	"url" text NOT NULL,
	"size" integer NOT NULL,
	"mime_type" varchar(256) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_articleId_articles_minifluxId_fk" FOREIGN KEY ("articleId") REFERENCES "public"."articles"("minifluxId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "enclosures";