import { betterAuth } from "better-auth";
import { jwt, openAPI, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { apiKey } from "@better-auth/api-key";
import { oauthProvider } from "@better-auth/oauth-provider";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/drizzle/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: "http://localhost:3000/",
  emailAndPassword: { enabled: true },
  plugins: [
    jwt(),
    twoFactor(),
    passkey(),
    apiKey(),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
    }),
    openAPI(),
  ],
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
