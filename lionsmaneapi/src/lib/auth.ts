import { apiKey } from "@better-auth/api-key";
import { oauthProvider } from "@better-auth/oauth-provider";
import { passkey } from "@better-auth/passkey";
import { adapter as mikroOrmAdapter } from "@lubiah/better-auth-mikro-orm";
import { betterAuth } from "better-auth";
import { jwt, openAPI, twoFactor } from "better-auth/plugins";

import { initORM, type Services } from "@/db";

function buildAuth(db: Services) {
  return betterAuth({
    database: mikroOrmAdapter(db.orm),
    baseURL: process.env.HOST_URL || "http://localhost:4000/",
    plugins: [
      jwt(),
      twoFactor(),
      passkey(),
      apiKey(),
      oauthProvider({
        loginPage: "/sign-in",
        consentPage: "/consent",
        silenceWarnings: { oauthAuthServerConfig: true },
      }),
      openAPI(),
    ],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
}

export type Auth = ReturnType<typeof buildAuth>;

let cache: Promise<Auth> | undefined;

export function getAuth(services?: Services): Promise<Auth> {
  if (!cache) {
    // this lets us use existing ORM connections or use a dummy connection in tests
    cache = (async () => buildAuth(services ?? (await initORM())))();
  }
  return cache;
}
