DROP INDEX "articles_category_idx";--> statement-breakpoint
DROP INDEX "articles_media_idx";--> statement-breakpoint
DROP INDEX "articles_podcast_idx";--> statement-breakpoint
DROP INDEX "articles_youtube_idx";--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "metaData" jsonb;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "metaData" jsonb;--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "authors";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "contributors";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "publisher";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "format";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "rights";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "categories";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "comments";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "commentRss";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "geo";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "georss";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "encoded";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "imageAlt";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "media";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "youtube";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "podcast";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "thread";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "guid";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "itunes";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "authors";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "contributors";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "categories";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "copyright";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "rights";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "explicit";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "subjects";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "updatePeriod";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "updateFrequency";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "updateBase";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "publishers";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "formats";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "languages";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "youtube";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "podcast";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "geo";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "georss";--> statement-breakpoint
CREATE INDEX "articles_jsonb_metaData_idx" ON "articles" USING gin ("metaData");