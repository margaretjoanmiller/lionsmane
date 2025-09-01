import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { passkey } from 'better-auth/plugins/passkey';
import { oidcProvider, openAPI, twoFactor } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const authOptions = {
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
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
  trustedOrigins: ['http://localhost:3000', 'https://localhost:8181'],
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions) as ReturnType<typeof betterAuth>;
