CREATE TYPE "public"."user_filter_actions" AS ENUM('blur', 'markRead', 'hide');--> statement-breakpoint
ALTER TABLE "user_filters" RENAME COLUMN "actions" TO "action";--> statement-breakpoint
DROP INDEX "user_filters_actions_idx";--> statement-breakpoint
ALTER TABLE "applied_rules" ALTER COLUMN "action" SET DATA TYPE "public"."user_filter_actions" USING "action"::"public"."user_filter_actions";--> statement-breakpoint
ALTER TABLE "applied_rules" ALTER COLUMN "contentWarning" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_article_states" ALTER COLUMN "isBlurred" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_article_states" ALTER COLUMN "isHidden" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_filters" ALTER COLUMN "conditions" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "user_filters_actions_idx" ON "user_filters" USING btree ("userId","action");