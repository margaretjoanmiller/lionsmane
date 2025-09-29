import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { apiKey, oidcProvider, openAPI, twoFactor } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { db } from './db';
import { sendAuthEmail } from './utils/email-auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
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
    // only require email verification when SMTP host is set
    requireEmailVerification: process.env.SMTP_HOST !== 'undefined',
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
