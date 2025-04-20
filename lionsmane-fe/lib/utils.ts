/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2-or-later.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
