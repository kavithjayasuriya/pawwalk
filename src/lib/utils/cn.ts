/**
 * Utility for merging Tailwind CSS class names.
 *
 * This is a minimal implementation that avoids adding clsx/tailwind-merge
 * as dependencies. It filters out falsy values and joins the rest.
 * Replace with clsx + tailwind-merge if class conflicts become an issue.
 */
export function cn(
  ...inputs: (string | undefined | null | false)[]
): string {
  return inputs.filter(Boolean).join(' ');
}
