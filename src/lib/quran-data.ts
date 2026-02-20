export const TOTAL_AHZAB = 60;
export const TOMON_PER_HIZB = 8;

export const TOMON_LABELS: string[] = [
  "الثُمن الأول",
  "الثُمن الثاني",
  "الثُمن الثالث",
  "الثُمن الرابع",
  "الثُمن الخامس",
  "الثُمن السادس",
  "الثُمن السابع",
  "الثُمن الثامن",
];

/**
 * Get the audio filename for a given hizb and tomon.
 * Files follow the pattern: {sequence}_t{tomon}_h{hizb}.mp3
 * sequence = (hizb - 1) * 8 + tomon
 */
export function getAudioFilename(hizb: number, tomon: number): string {
  const sequence = (hizb - 1) * TOMON_PER_HIZB + tomon;
  const seq = String(sequence).padStart(3, "0");
  const t = String(tomon).padStart(2, "0");
  const h = String(hizb).padStart(2, "0");
  return `${seq}_t${t}_h${h}.mp3`;
}

/**
 * Get the audio URL for a given hizb and tomon.
 */
export function getAudioUrl(hizb: number, tomon: number): string {
  return `/audio/${getAudioFilename(hizb, tomon)}`;
}

/**
 * Get the next tomon/hizb after the current one.
 * Returns null if at the very end (hizb 60, tomon 8).
 */
export function getNext(
  hizb: number,
  tomon: number,
): { hizb: number; tomon: number } | null {
  if (tomon < TOMON_PER_HIZB) {
    return { hizb, tomon: tomon + 1 };
  }
  if (hizb < TOTAL_AHZAB) {
    return { hizb: hizb + 1, tomon: 1 };
  }
  return null;
}

/**
 * Get the previous tomon/hizb before the current one.
 * Returns null if at the very beginning (hizb 1, tomon 1).
 */
export function getPrevious(
  hizb: number,
  tomon: number,
): { hizb: number; tomon: number } | null {
  if (tomon > 1) {
    return { hizb, tomon: tomon - 1 };
  }
  if (hizb > 1) {
    return { hizb: hizb - 1, tomon: TOMON_PER_HIZB };
  }
  return null;
}
