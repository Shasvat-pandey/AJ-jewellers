// Central image-URL contract. Backend may return legacy plain strings
// ("/uploads/xxx.jpg") or new variant objects — both resolve here so every
// consumer uses one code path.
import type { ProductImage } from '../types';
import { API_BASE } from './api';

export type ImageEntry = string | ProductImage | null | undefined;

export function resolveOriginal(entry: ImageEntry): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry.original || entry.thumbnail || entry.medium || entry.large || '';
}

export function resolveVariant(
  entry: ImageEntry,
  variant: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium'
): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[variant] || entry.original || '';
}

export function resolveAlt(entry: ImageEntry, fallback: string): string {
  if (entry && typeof entry !== 'string' && entry.alt) return entry.alt;
  return fallback;
}

/** Absolute URL for any stored path; remote/assets pass through. */
export function getImageUrl(entry: ImageEntry): string {
  const raw = resolveOriginal(entry);
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/.test(raw)) return raw;
  if (raw.startsWith('/uploads')) return `${API_BASE}${raw}`;
  if (raw.startsWith('/')) return raw; // public asset e.g. /placeholder
  return raw;
}

/** Absolute URL for a specific variant (falls back to original). */
export function getVariantUrl(
  entry: ImageEntry,
  variant: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium'
): string {
  const raw = resolveVariant(entry, variant);
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/.test(raw)) return raw;
  if (raw.startsWith('/uploads')) return `${API_BASE}${raw}`;
  return raw;
}

/**
 * Responsive srcSet from stored variants:
 * 400w -> thumbnail, 800w -> medium, 1600w -> large.
 * Legacy single-URL entries return '' (plain src used).
 */
export function buildSrcSet(entry: ImageEntry): string {
  if (!entry || typeof entry === 'string') return '';
  const t = getVariantUrl(entry, 'thumbnail');
  const m = getVariantUrl(entry, 'medium');
  const l = getVariantUrl(entry, 'large');
  const parts: string[] = [];
  if (t) parts.push(`${t} 400w`);
  if (m) parts.push(`${m} 800w`);
  if (l) parts.push(`${l} 1600w`);
  // Deduplicate (legacy-normalised objects repeat the same URL)
  return [...new Set(parts)].join(', ');
}
