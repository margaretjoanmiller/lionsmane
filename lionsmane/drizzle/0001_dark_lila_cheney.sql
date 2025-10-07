ALTER TABLE "articles" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "geo" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "geo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_hash_unique" UNIQUE("hash");