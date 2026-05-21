/**
 * store/nanoid.ts
 * Tiny ID generator — avoids adding a full nanoid dependency.
 */
export const nanoid = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
