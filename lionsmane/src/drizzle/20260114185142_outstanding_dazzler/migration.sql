ALTER TABLE "articles" DROP COLUMN "contributor";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "subjects";--> statement-breakpoint
ALTER TABLE "applied_rules" ALTER COLUMN "action" SET DATA TYPE varchar(256) USING "action"::varchar(256);--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "authors" SET DEFAULT '{"authors":[]}';--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "contributors" SET DEFAULT '{"contributors":[]}';--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "categories" SET DEFAULT '{"categories":[]}';--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "authors" SET DEFAULT '{"authors":[]}';--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "authors" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "contributors" SET DEFAULT '{"contributors":[]}';--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "categories" SET DEFAULT '{"categories":[]}';--> statement-breakpoint
DROP TYPE "user_filter_actions";