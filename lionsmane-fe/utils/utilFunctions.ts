/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
