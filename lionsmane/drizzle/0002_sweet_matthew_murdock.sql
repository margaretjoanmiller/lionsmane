ALTER TABLE "feeds" DROP COLUMN "image"; --> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "image" jsonb; --> statement-breakpoint
