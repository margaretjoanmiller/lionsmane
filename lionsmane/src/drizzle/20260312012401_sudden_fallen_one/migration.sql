CREATE INDEX "articles_category_idx" ON "articles" USING pgroonga ("categories");--> statement-breakpoint
CREATE INDEX "feeds_category_idx" ON "feeds" USING pgroonga ("categories");