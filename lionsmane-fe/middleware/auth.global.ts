/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, session } = useUserSession();

  if (
    session.value?.isAuthenticated ||
    to.path.startsWith('/auth') ||
    to.path.startsWith('/api') ||
    to.path.startsWith('/login') ||
    to.path == '/'
  ) {
    // redirect the user to the login screen if they're not authenticated
    return;
  }

  return navigateTo('/login');
});
