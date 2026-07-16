import { apiKey } from '@better-auth/api-key';
import { oauthProvider } from '@better-auth/oauth-provider';
import { passkey } from '@better-auth/passkey';
import { adapter as mikroOrmAdapter } from '@lubiah/better-auth-mikro-orm';
import { betterAuth } from 'better-auth';
import { jwt, openAPI, twoFactor } from 'better-auth/plugins';

import { initORM } from '@/db';

const db = await initORM();

export const auth = betterAuth({
	database: mikroOrmAdapter(db.orm),
	baseURL: 'http://localhost:4000/',
	plugins: [
		jwt(),
		twoFactor(),
		passkey(),
		apiKey(),
		oauthProvider({
			loginPage: '/sign-in',
			consentPage: '/consent',
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
