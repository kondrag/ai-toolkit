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
    id: crypto.randomUUID(),
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
