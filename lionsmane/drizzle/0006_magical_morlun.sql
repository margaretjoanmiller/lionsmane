CREATE INDEX "articles_category_idx" ON "articles" USING pgroonga ("categories");--> statement-breakpoint
CREATE INDEX "articles_media_idx" ON "articles" USING pgroonga ("media");