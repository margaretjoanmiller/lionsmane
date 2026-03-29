CREATE TABLE "readeck_config" (
	"user_id" text PRIMARY KEY,
	"encrypted_payload" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "readeck_config" ADD CONSTRAINT "readeck_config_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;