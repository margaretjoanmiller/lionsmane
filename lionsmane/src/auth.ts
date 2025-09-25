import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { apiKey, oidcProvider, openAPI, twoFactor } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { db } from './db';

const authOptions = {
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60, // Cache duration in seconds
    },
  },
  plugins: [
    apiKey(),
    passkey(),
    twoFactor(),
    openAPI(),
    oidcProvider({
      loginPage: '/login', // path to the login page
    }),
  ],
  telemetry: { enabled: false },
  trustedOrigins: ['http://localhost:3000', process.env.FE_URL!].filter(
    Boolean,
  ),
};

export const auth = betterAuth(authOptions);
