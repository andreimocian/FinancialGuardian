// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely (handles conflicts like p-4 + p-2)
 * and supports conditional classnames.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}