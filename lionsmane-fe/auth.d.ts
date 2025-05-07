/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

declare module '#auth-utils' {
  interface SecureSessionData {
    // Add your own fields
    access_token: string;
    refresh_token: string;
  }
}

export {};
