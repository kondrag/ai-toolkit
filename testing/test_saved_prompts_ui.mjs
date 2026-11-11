// Unit tests for the Saved Prompts pure helpers (ui/src/utils/savedPrompts.ts).
// The repo's UI has no test runner, so this script imports the module compiled
// standalone. Run from repo root:
//   cd ui && npx tsc --outDir /tmp/opencode/saved_prompts_build \
//     --module es2022 --target es2022 --moduleResolution bundler --strict \
//     src/utils/savedPrompts.ts && node testing/test_saved_prompts_ui.mjs
import assert from 'node:assert/strict';
import {
  SAVED_PROMPTS_KEY,
  nameFromPrompt,
  normalizeSavedPrompts,
  addSavedPrompt,
  renameSavedPrompt,
  removeSavedPrompt,
} from '/tmp/opencode/saved_prompts_build/savedPrompts.js';

// ---- SAVED_PROMPTS_KEY ----
assert.equal(SAVED_PROMPTS_KEY, 'aitk_generate_saved_prompts');

// ---- nameFromPrompt ----
assert.equal(nameFromPrompt('a cat\non a   mat'), 'a cat on a mat', 'collapses whitespace/newlines');
assert.equal(nameFromPrompt('  spaced   out  '), 'spaced out', 'trims ends');
assert.equal(nameFromPrompt('x'.repeat(40)), 'x'.repeat(40), 'exactly maxLen: no ellipsis');
assert.equal(nameFromPrompt('y'.repeat(41)), 'y'.repeat(40) + '…', 'over maxLen: truncated with ellipsis');
assert.equal(nameFromPrompt('z'.repeat(80), 20), 'z'.repeat(20) + '…', 'custom maxLen respected');
assert.equal(nameFromPrompt('   '), 'Untitled prompt', 'blank prompt gets default name');
assert.equal(nameFromPrompt(''), 'Untitled prompt', 'empty prompt gets default name');

// ---- normalizeSavedPrompts ----
const valid = { id: 'a1', name: 'cat prompt', prompt: 'a cat', negative_prompt: 'dogs', created_at: 123 };
assert.deepEqual(normalizeSavedPrompts([valid]), [valid], 'valid entry kept verbatim');

const fixed = normalizeSavedPrompts([
  { id: 'b1', prompt: 'a dog', created_at: 'nope' }, // missing name + negative + bad created_at
  { prompt: 'no id' }, // dropped: no id
  { id: 'c1', prompt: 42 }, // dropped: non-string prompt
  'junk', // dropped: not an object
]);
assert.equal(fixed.length, 1, 'invalid entries dropped');
assert.equal(fixed[0].id, 'b1');
assert.equal(fixed[0].name, nameFromPrompt('a dog'), 'missing name derived from prompt');
assert.equal(fixed[0].negative_prompt, '', 'missing negative_prompt defaults to empty');
assert.equal(fixed[0].created_at, 0, 'invalid created_at defaults to 0');

assert.deepEqual(normalizeSavedPrompts(null), [], 'null storage -> []');
assert.deepEqual(normalizeSavedPrompts(42), [], 'non-array -> []');
assert.deepEqual(normalizeSavedPrompts({ entries: [] }), [], 'object instead of array -> []');

// ---- addSavedPrompt ----
const entries = addSavedPrompt([], 'a cat on a mat', 'dogs');
assert.equal(entries.length, 1);
assert.equal(entries[0].prompt, 'a cat on a mat');
assert.equal(entries[0].negative_prompt, 'dogs');
assert.equal(entries[0].name, 'a cat on a mat', 'name derived from prompt');
assert.ok(entries[0].id, 'id generated');
assert.ok(entries[0].created_at > 0, 'created_at set');
const entries2 = addSavedPrompt(entries, 'second', '');
assert.equal(entries2.length, 2);
assert.equal(entries2[0].prompt, 'second', 'new entry prepended (newest first)');
assert.ok(entries2[0].created_at >= entries2[1].created_at, 'newer entry has >= created_at');
assert.equal(addSavedPrompt([], '   ', '').length, 0, 'blank prompt not saved');

// ---- renameSavedPrompt / removeSavedPrompt ----
const renamed = renameSavedPrompt(entries2, entries2[1].id, 'my cat');
assert.equal(renamed[1].name, 'my cat');
assert.equal(renamed[0].name, entries2[0].name, 'others untouched');
assert.deepEqual(renameSavedPrompt(entries2, 'missing-id', 'x'), entries2, 'unknown id: contents unchanged');

const removed = removeSavedPrompt(entries2, entries2[0].id);
assert.equal(removed.length, 1);
assert.equal(removed[0].prompt, 'a cat on a mat');
assert.equal(removeSavedPrompt(entries2, 'missing-id').length, 2, 'unknown id: nothing removed');

console.log('saved prompts UI helpers: all tests passed');
