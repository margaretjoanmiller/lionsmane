ALTER TABLE "articles" ALTER COLUMN "image" SET DATA TYPE varchar(512);--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "media" SET DATA TYPE varchar(512)[];--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "media" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "imageAlt" varchar(512);