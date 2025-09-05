import { createAuthClient } from 'better-auth/react'
import { twoFactorClient, passkeyClient } from 'better-auth/client/plugins'
export const authClient = createAuthClient({
  baseURL: 'http://localhost:8181', // The base URL of your auth server
  plugins: [twoFactorClient(), passkeyClient()],
})
