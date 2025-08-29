import { passkeyClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/vue';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:8181/api/auth',
    plugins: [passkeyClient(), twoFactorClient()],
});