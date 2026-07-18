import { passkeyClient } from '@better-auth/passkey/client';
import { twoFactorClient } from 'better-auth/plugins';
import { createAuthClient } from 'better-auth/react';
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: 'http://localhost:4000',
  plugins: [twoFactorClient(), passkeyClient()],
});
