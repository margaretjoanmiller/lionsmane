/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, login } = useOidcAuth();

  if (
    loggedIn.value ||
    to.path.startsWith('/auth') ||
    to.path.startsWith('/login') ||
    to.path == '/'
  ) {
    return;
  }
  await login();
});
