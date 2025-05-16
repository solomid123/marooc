import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if a given path is active based on the current pathname
 * @param path The path to check
 * @param pathname The current pathname
 * @param exact Whether to check for exact match or just the beginning of the path
 * @returns boolean indicating if the path is active
 */
export function isActivePath(path: string, pathname: string, exact: boolean = false): boolean {
  return exact ? pathname === path : pathname.startsWith(path)
}
