/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

import { appendResponseHeader } from 'h3';
import { parse, parseSetCookie, serialize } from 'cookie-es';
import type { JwtData } from '@tsndr/cloudflare-worker-jwt';
import { decode } from '@tsndr/cloudflare-worker-jwt';

export default defineNuxtRouteMiddleware(async () => {
  const nuxtApp = useNuxtApp();
  // Don't run on client hydration when server rendered
  if (
    import.meta.client &&
    nuxtApp.isHydrating &&
    nuxtApp.payload.serverRendered
  )
    return;

  const {
    session,
    clear: clearSession,
    fetch: fetchSession,
  } = useUserSession();
  // Ignore if no tokens

  if (!session.value) return;

  // Both tokens expired, clearing session
  // if (isExpired(session)) {
  //   console.info('both tokens expired, clearing session');
  //   await clearSession();
  //   // return navigateTo('/login')
  // }
  // Access token expired, refreshing
  if (isExpired(session)) {
    console.info('access token expired, refreshing');
    await useRequestFetch()('/auth/refresh');
    // onResponse({ response: { headers } }) {
    //   // Forward the Set-Cookie header to the main server event
    //   if (import.meta.server && serverEvent) {
    //     for (const setCookie of headers.getSetCookie()) {
    //       appendResponseHeader(serverEvent, 'Set-Cookie', setCookie);
    //       // Update session cookie for next fetch requests
    //       const { name, value } = parseSetCookie(setCookie);
    //       if (name === runtimeConfig.session.name) {
    //         // console.log('updating headers.cookie to', value)
    //         const cookies = parse(serverEvent.headers.get('cookie') || '');
    //         // set or overwrite existing cookie
    //         cookies = value;
    //         // update cookie event header for future requests
    //         serverEvent.headers.set(
    //           'cookie',
    //           Object.entries(cookies)
    //             .map(() => serialize(name, value))
    //             .join('; '),
    //         );
    //         // Also apply to serverEvent.node.req.headers
    //         if (serverEvent.node?.req?.headers) {
    //           serverEvent.node.req.headers['cookie'] =
    //             serverEvent.headers.get('cookie') || '';
    //         }
    //       }
    //     }
    //   }
    // },
    // refresh the session
    await fetchSession();
  }
});

function isExpired(session) {
  return (Date.now() - session.value.loggedInAt) / 1000 > session.expiresIn;
}
