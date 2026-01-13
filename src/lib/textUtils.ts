/**
 * Text utilities for proper Unicode grapheme cluster handling.
 */

const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
  ? new Intl.Segmenter("vi", { granularity: "grapheme" })
  : null;

/**
 * Count grapheme clusters (user-perceived characters) in a string.
 */
export function countGraphemes(text: string): number {
  if (!text) return 0;
  return segmenter ? [...segmenter.segment(text)].length : [...text].length;
}

/**
 * Truncate string to a maximum number of grapheme clusters.
 */
export function truncateToGraphemes(text: string, maxLength: number): string {
  if (!text || maxLength <= 0) return "";
  if (segmenter) {
    const segments = [...segmenter.segment(text)];
    return segments.length <= maxLength ? text : segments.slice(0, maxLength).map((s) => s.segment).join("");
  }
  const chars = [...text];
  return chars.length <= maxLength ? text : chars.slice(0, maxLength).join("");
}
