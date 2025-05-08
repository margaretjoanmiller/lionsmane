/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

export default defineOAuthKeycloakEventHandler({
  // config: {}, use runtimeconf
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, {
      user: {
        name: user.upn,
        email: user.email,
      },
      secure: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
      },
      isAuthenticated: true,
      loggedInAt: Date.now(),
    });

    return sendRedirect(event, '/');
  },
  onError(event, error) {
    console.error('Keycloak OAuth error:', error);
    return sendRedirect(event, '/');
  },
});
