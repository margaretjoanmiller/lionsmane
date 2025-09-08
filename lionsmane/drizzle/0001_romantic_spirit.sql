CREATE TABLE "applied_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"articleId" uuid NOT NULL,
	"ruleId" uuid NOT NULL,
	"appliedAt" timestamp DEFAULT now() NOT NULL,
	"action" varchar(20) NOT NULL,
	"contentWarning" text,
	"isUndone" boolean DEFAULT false NOT NULL,
	"undoneAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_filters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"conditions" jsonb,
	"actions" jsonb,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_article_states" ADD COLUMN "isBlurred" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_article_states" ADD COLUMN "isHidden" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_articleId_articles_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applied_rules" ADD CONSTRAINT "applied_rules_ruleId_user_filters_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."user_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_filters" ADD CONSTRAINT "user_filters_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applied_rules_user_article_idx" ON "applied_rules" USING btree ("userId","articleId");--> statement-breakpoint
CREATE INDEX "applied_rules_rule_idx" ON "applied_rules" USING btree ("ruleId");--> statement-breakpoint
CREATE INDEX "applied_rules_applied_at_idx" ON "applied_rules" USING btree ("appliedAt");--> statement-breakpoint
CREATE INDEX "user_filters_user_idx" ON "user_filters" USING btree ("userId","conditions");--> statement-breakpoint
CREATE INDEX "user_filters_actions_idx" ON "user_filters" USING btree ("userId","actions");