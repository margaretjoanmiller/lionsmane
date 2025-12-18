ALTER TABLE "articles" DROP CONSTRAINT "articles_feed_id_url_unique";--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feed_id_text_unique" UNIQUE("feedId","rawContent");