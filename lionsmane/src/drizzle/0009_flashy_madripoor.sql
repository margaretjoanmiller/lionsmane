ALTER TABLE "articles" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "url" SET DATA TYPE text;