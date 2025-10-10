ALTER TABLE "enclosures" RENAME COLUMN "articleId" TO "entry_id";--> statement-breakpoint
ALTER TABLE "enclosures" DROP CONSTRAINT "enclosures_articleId_articles_minifluxId_fk";
--> statement-breakpoint
ALTER TABLE "enclosures" ADD COLUMN "media_progression" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_entry_id_articles_minifluxId_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."articles"("minifluxId") ON DELETE cascade ON UPDATE no action;