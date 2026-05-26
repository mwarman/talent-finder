import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names using clsx and tailwind-merge.
 * This allows for conditional class names and ensures that Tailwind CSS classes are merged correctly.
 *
 * @param inputs - An array of class values (strings, objects, arrays) to be merged.
 * @returns A single string of merged class names.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};
