import { db } from '@/db/index';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from 'better-auth/plugins/passkey';
import { oidcProvider, openAPI, twoFactor } from 'better-auth/plugins';
import * as schema from '@/db/schema/auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
    },
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
  plugins: [
    passkey(),
    twoFactor(),
    openAPI(),
    oidcProvider({
      loginPage: '/login', // path to the login page
    }),
  ],
  telemetry: { enabled: false },
  trustedDomains: ['localhost'],
  trustedOrigins: ['http://localhost:3000', 'https://localhost:8181'],
});
