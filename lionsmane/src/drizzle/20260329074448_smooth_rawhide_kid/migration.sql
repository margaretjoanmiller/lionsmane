CREATE INDEX "articles_feed_published_idx" ON "articles" ("feedId","published" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "feeds_lastChecked_idx" ON "feeds" ("lastChecked");--> statement-breakpoint
CREATE INDEX "user_feeds_user_folder_idx" ON "subscriptions" ("userId","folderId");--> statement-breakpoint
CREATE INDEX "user_article_states_user_hidden_idx" ON "user_article_states" ("userId","isHidden");--> statement-breakpoint
CREATE INDEX "user_article_states_user_blurred_idx" ON "user_article_states" ("userId","isBlurred");