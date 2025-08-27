import { db } from '@/db/index';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from 'better-auth/plugins/passkey';
import { bearer, oidcProvider, openAPI, twoFactor } from 'better-auth/plugins';
import * as schema from '@/db/schema/auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg', // or "mysql", "sqlite"
    schema: {
      ...schema,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    // bearer(),
    passkey(),
    twoFactor(),
    openAPI(),
    oidcProvider({
      loginPage: '/sign-in', // path to the login page
    }),
  ],
  telemetry: { enabled: false },
  trustedDomains: ['localhost']
});
