// ─────────────────────────────────────────────────────────────────────────────
// CMS-managed JSON-LD schema overrides (edited in the admin → IT Schema).
// Data lives in schema-overrides.json so the CMS can write raw JSON-LD safely.
//
// `global` is injected at the end of <body> on every IT page. `byPath` maps a
// URL path to a raw JSON-LD string injected on that page.
// ─────────────────────────────────────────────────────────────────────────────
import overrides from './schema-overrides.json';

export const schemaOverrides = overrides as { global: string; byPath: Record<string, string> };
