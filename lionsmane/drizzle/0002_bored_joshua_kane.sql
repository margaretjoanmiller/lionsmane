ALTER TABLE "user" ADD COLUMN "minifluxId" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_minifluxId_unique" UNIQUE("minifluxId");