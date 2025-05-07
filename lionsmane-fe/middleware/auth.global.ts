/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession();

  // redirect the user to the login screen if they're not authenticated
  if (
    loggedIn.value ||
    to.path.startsWith('/auth') ||
    to.path.startsWith('/api') ||
    to.path.startsWith('/login') ||
    to.path == '/'
  ) {
    return;
  }
  return navigateTo('/login');
});
