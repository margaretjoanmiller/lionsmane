ALTER TABLE "feeds" RENAME COLUMN "siteUrl" TO "site_url";--> statement-breakpoint
ALTER TABLE "feeds" RENAME COLUMN "etag" TO "etag_header";--> statement-breakpoint
ALTER TABLE "feeds" RENAME COLUMN "lastModified" TO "last_modified_header";--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "icons" ALTER COLUMN "width" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "icons" ALTER COLUMN "height" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "icons" ALTER COLUMN "type" DROP NOT NULL;