/**
 * Text utilities for proper Unicode grapheme cluster handling.
 * Essential for languages like Vietnamese that use combining diacritical marks.
 */

/**
 * Count grapheme clusters (user-perceived characters) in a string.
 * Uses Intl.Segmenter for accurate Unicode handling.
 *
 * @param text - The string to count characters in
 * @returns The number of grapheme clusters (displayed characters)
 */
export function countGraphemes(text: string): number {
  if (!text) return 0;

  // Use Intl.Segmenter for accurate grapheme counting
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("vi", { granularity: "grapheme" });
    return [...segmenter.segment(text)].length;
  }

  // Fallback for older browsers - use spread operator
  // This handles most cases but may not be perfect for all combining characters
  return [...text].length;
}

/**
 * Truncate string to a maximum number of grapheme clusters.
 * Ensures truncation doesn't split combining characters.
 *
 * @param text - The string to truncate
 * @param maxLength - Maximum number of grapheme clusters
 * @returns The truncated string
 */
export function truncateToGraphemes(text: string, maxLength: number): string {
  if (!text || maxLength <= 0) return "";

  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("vi", { granularity: "grapheme" });
    const segments = [...segmenter.segment(text)];
    if (segments.length <= maxLength) return text;
    return segments
      .slice(0, maxLength)
      .map((s) => s.segment)
      .join("");
  }

  // Fallback
  const chars = [...text];
  if (chars.length <= maxLength) return text;
  return chars.slice(0, maxLength).join("");
}
