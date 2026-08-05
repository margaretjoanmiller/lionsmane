import { apiKey } from '@better-auth/api-key';
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2';
import { oauthProvider } from '@better-auth/oauth-provider';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { jwt, openAPI, twoFactor } from 'better-auth/plugins';

import { db } from '@/db';

import * as schema from '../../drizzle/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: process.env.HOST_URL || 'http://localhost:4000/',
  plugins: [
    // jwt(),
    twoFactor(),
    passkey(),
    apiKey(),
    // oauthProvider({
    //   loginPage: '/sign-in',
    //   consentPage: '/consent',
    //   silenceWarnings: { oauthAuthServerConfig: true },
    // }),
    openAPI(),
  ],
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.HOST_FE, 'http://localhost:3000'],
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
