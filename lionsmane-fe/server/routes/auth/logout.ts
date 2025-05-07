/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

export default eventHandler(async (event) => {
  const { secure } = await getUserSession(event);

  const keycloakConfig = useRuntimeConfig().oauth.keycloak;

  if (!secure?.access_token && !secure?.refresh_token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const tokenResponse = await $fetch(
    `${keycloakConfig.serverUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`,
    {
      headers: {
        Authorization: `Bearer ${secure?.access_token}`,
      },
    },
  );

  await clearUserSession(event);
});
