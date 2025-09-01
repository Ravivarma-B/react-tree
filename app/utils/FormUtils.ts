import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge conditional Tailwind classes.
 * - Uses clsx for conditional class logic
 * - Uses tailwind-merge to dedupe conflicting classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
