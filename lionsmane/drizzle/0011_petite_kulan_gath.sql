ALTER TABLE "articles" DROP CONSTRAINT "articles_feed_id_text_unique";--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_feed_id_hash_unique" UNIQUE("feedId","hash");