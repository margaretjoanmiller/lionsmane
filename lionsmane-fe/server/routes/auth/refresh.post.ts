/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

export default eventHandler(async (event) => {
  const session = await getUserSession(event);

  const keycloakConfig = useRuntimeConfig().oauth.keycloak;

  if (!session.tokens?.access_token && !session.tokens?.refresh_token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const tokenResponse = await $fetch(
    `${keycloakConfig.serverUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: keycloakConfig.clientId,
        client_secret: keycloakConfig.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: session.tokens?.refresh_token,
      }),
    },
  );

  await setUserSession(event, {
    tokens: {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
    },
    loggedInAt: Date.now(),
  });

  return {
    access_token: session.tokens.access_token,
    refresh_token: session.tokens.refresh_token,
  };
});
