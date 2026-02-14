/**
 * Format a number into a compact human-readable string.
 *
 * Examples:
 *   formatNumber(540)       -> "540"
 *   formatNumber(1_000)     -> "1K"
 *   formatNumber(1_234)     -> "1.2K"
 *   formatNumber(12_345)    -> "12.3K"
 *   formatNumber(1_000_000) -> "1M"
 *   formatNumber(2_500_000) -> "2.5M"
 */
export function formatNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const formatted = (abs / 1_000_000_000).toFixed(1);
    return `${sign}${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
  }

  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toFixed(1);
    return `${sign}${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }

  if (abs >= 1_000) {
    const formatted = (abs / 1_000).toFixed(1);
    return `${sign}${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }

  return `${sign}${abs}`;
}

/**
 * Generate a UUID v4-like identifier.
 *
 * Uses `crypto.getRandomValues` when available (React Native Hermes),
 * otherwise falls back to `Math.random`.
 */
export function generateId(): string {
  const getRandomByte = (): number => {
    if (
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      const buf = new Uint8Array(1);
      globalThis.crypto.getRandomValues(buf);
      return buf[0];
    }
    return Math.floor(Math.random() * 256);
  };

  const hex = (byte: number): string => byte.toString(16).padStart(2, '0');

  const bytes = Array.from({ length: 16 }, getRandomByte);

  // Set version (4) and variant (10xx) bits per RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const h = bytes.map(hex);

  return [
    h.slice(0, 4).join(''),
    h.slice(4, 6).join(''),
    h.slice(6, 8).join(''),
    h.slice(8, 10).join(''),
    h.slice(10, 16).join(''),
  ].join('-');
}

/**
 * Clamp a value between a minimum and maximum.
 */
export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/**
 * Create a debounced version of a function.
 *
 * The returned function also exposes a `.cancel()` method to
 * clear any pending invocation.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: unknown[]) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delayMs);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Format a date (or ISO string) into a human-readable relative time string.
 *
 * Examples:
 *   formatTimeAgo(new Date())                     -> "just now"
 *   formatTimeAgo(Date.now() - 30_000)            -> "30s ago"
 *   formatTimeAgo(Date.now() - 5 * 60_000)        -> "5m ago"
 *   formatTimeAgo(Date.now() - 3 * 3_600_000)     -> "3h ago"
 *   formatTimeAgo(Date.now() - 2 * 86_400_000)    -> "2d ago"
 *   formatTimeAgo(Date.now() - 14 * 86_400_000)   -> "2w ago"
 *   formatTimeAgo(Date.now() - 60 * 86_400_000)   -> "2mo ago"
 *   formatTimeAgo(Date.now() - 400 * 86_400_000)  -> "1y ago"
 */
export function formatTimeAgo(date: Date | string | number): string {
  const now = Date.now();
  let timestamp: number;

  if (typeof date === 'string') {
    timestamp = new Date(date).getTime();
  } else if (date instanceof Date) {
    timestamp = date.getTime();
  } else {
    timestamp = date;
  }

  const diffMs = now - timestamp;

  if (diffMs < 0) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1_000);
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 5) {
    return 'just now';
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  if (weeks < 5) {
    return `${weeks}w ago`;
  }
  if (months < 12) {
    return `${months}mo ago`;
  }
  return `${years}y ago`;
}
