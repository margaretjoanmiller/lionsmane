/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

export default eventHandler(async (event) => {
  const { secure } = await requireUserSession(event);

  const keycloakConfig = useRuntimeConfig().oauth.keycloak;

  if (!secure?.access_token && !secure?.refresh_token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  //@ts-expect-error
  const { access_token, refresh_token } = await $fetch(
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
        refresh_token: secure?.refresh_token,
      }),
    },
  );

  await setUserSession(event, {
    secure: {
      access_token,
      refresh_token,
    },
    loggedInAt: Date.now(),
  });

  return {};
});
