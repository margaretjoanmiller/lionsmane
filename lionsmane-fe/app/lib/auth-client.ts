import { passkeyClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/vue';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:8181/api/auth',
    plugins: [passkeyClient(), twoFactorClient()],
    fetchOptions: {
        onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get('set-auth-token');
            if (authToken) {
                localStorage.setItem('bearer_token', authToken);
            }
        },
    },
});