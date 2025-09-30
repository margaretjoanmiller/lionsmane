import {
  apiKeyClient,
  inferAdditionalFields,
  passkeyClient,
  twoFactorClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8181', // The base URL of your auth server
  plugins: [
    twoFactorClient(),
    passkeyClient(),
    apiKeyClient(),
    inferAdditionalFields({
      user: {
        hasReadeckKey: {
          type: 'boolean',
        },
      },
    }),
  ],
});
