import { apiKey } from '@better-auth/api-key';
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { oidcProvider, openAPI, twoFactor } from 'better-auth/plugins';
import { coreSchema, db } from './db';
import { sendAuthEmail } from './utils/email-auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: coreSchema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail(
        user.email,
        'Reset password',
        `Click the link to reset your password: ${url}`,
      );
    },
    requireEmailVerification: process.env.SMTP_HOST
      ? process.env.SMTP_HOST.length > 0
      : false,
  },
  emailVerification: {
    sendOnSignUp: process.env.NODE_ENV === 'production',
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
  user: {
    additionalFields: {
      hasReadeckKey: {
        type: 'boolean',
        defaultValue: false,
      },
      minifluxId: {
        type: 'number',
      },
    },
  },
  plugins: [
    apiKey({
      enableSessionForAPIKeys: true,
      apiKeyHeaders: ['x-auth-token', 'x-api-key'],
      rateLimit: {
        maxRequests: 500,
      },
    }),
    passkey(),
    twoFactor(),
    openAPI(),
    oidcProvider({
      loginPage: '/login', // path to the login page
    }),
  ],
  telemetry: { enabled: false },
  trustedOrigins: ['http://localhost:3000'].concat(
    process.env.CORS_ORIGIN?.split(',') || [],
  ),
  sendVerificationEmail: async ({ user, url }) => {
    await sendAuthEmail(
      user.email,
      'Verify email',
      `Click the link to verify your email: ${url}`,
    );
  },
});
