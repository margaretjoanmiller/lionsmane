CREATE TYPE "filterAction" AS ENUM('blur', 'hide', 'markRead');--> statement-breakpoint
ALTER TABLE "applied_rules" ALTER COLUMN "action" SET DATA TYPE "filterAction" USING "action"::"filterAction";