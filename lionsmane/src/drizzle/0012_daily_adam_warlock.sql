CREATE INDEX "articles_youtube_idx" ON "articles" USING pgroonga ("youtube");--> statement-breakpoint
CREATE INDEX "articles_podcast_idx" ON "articles" USING pgroonga ("podcast");