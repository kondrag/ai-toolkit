// Saved prompts library for the Generate page.
// Entries live in localStorage (per-browser) and are loaded/saved as a plain
// array. The pure helpers below are unit-tested (testing/test_saved_prompts_ui.mjs);
// only loadSavedPrompts/saveSavedPrompts touch storage.

export interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  negative_prompt: string;
  created_at: number;
}

export const SAVED_PROMPTS_KEY = 'aitk_generate_saved_prompts';
export const DEFAULT_PROMPT_NAME = 'Untitled prompt';

// crypto.randomUUID is only exposed in secure contexts (https / localhost).
// On a plain-http LAN host it is undefined, so fall back to a v4 uuid built
// from crypto.getRandomValues, which is available everywhere.
export function newSavedPromptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nameFromPrompt(prompt: string, maxLen: number = 40): string {
  const clean = (prompt || '').replace(/\s+/g, ' ').trim();
  if (!clean) return DEFAULT_PROMPT_NAME;
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
}

export function normalizeSavedPrompts(value: unknown): SavedPrompt[] {
  if (!Array.isArray(value)) return [];
  const entries: SavedPrompt[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== 'string' || !rec.id) continue;
    if (typeof rec.prompt !== 'string') continue;
    entries.push({
      id: rec.id,
      name: typeof rec.name === 'string' && rec.name ? rec.name : nameFromPrompt(rec.prompt),
      prompt: rec.prompt,
      negative_prompt: typeof rec.negative_prompt === 'string' ? rec.negative_prompt : '',
      created_at: typeof rec.created_at === 'number' && Number.isFinite(rec.created_at) ? rec.created_at : 0,
    });
  }
  return entries;
}

export function addSavedPrompt(entries: SavedPrompt[], prompt: string, negativePrompt: string): SavedPrompt[] {
  const clean = (prompt || '').trim();
  if (!clean) return entries;
  const entry: SavedPrompt = {
    id: newSavedPromptId(),
    name: nameFromPrompt(clean),
    prompt: clean,
    negative_prompt: (negativePrompt || '').trim(),
    created_at: Date.now(),
  };
  return [entry, ...entries]; // newest first
}

export function renameSavedPrompt(entries: SavedPrompt[], id: string, name: string): SavedPrompt[] {
  const clean = (name || '').trim();
  if (!clean) return entries;
  return entries.map(e => (e.id === id ? { ...e, name: clean } : e));
}

export function removeSavedPrompt(entries: SavedPrompt[], id: string): SavedPrompt[] {
  return entries.filter(e => e.id !== id);
}

export function loadSavedPrompts(): SavedPrompt[] {
  if (typeof window === 'undefined') return [];
  try {
    return normalizeSavedPrompts(JSON.parse(window.localStorage.getItem(SAVED_PROMPTS_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function saveSavedPrompts(entries: SavedPrompt[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(entries));
}
