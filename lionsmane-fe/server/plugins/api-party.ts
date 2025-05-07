/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

export default defineNitroPlugin((nitroApp) => {
  // Generic request hook: runs before any API request on the server
  nitroApp.hooks.hook('api-party:request:lion', async (ctx, event) => {
    try {
      const { secure } = await requireUserSession(event);

      ctx.options.headers.set(
        'Authorization',
        `Bearer ${secure?.access_token}`,
      );
    } catch {
      await clearUserSession(event);
      await setUserSession(event, {
        isAuthenticated: false,
      });
    }
  });
});
