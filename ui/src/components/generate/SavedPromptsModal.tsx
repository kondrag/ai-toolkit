'use client';
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { TextInput } from '@/components/formInputs';
import { SavedPrompt } from '@/utils/savedPrompts';

interface SavedPromptsModalProps {
  isOpen: boolean;
  entries: SavedPrompt[];
  onClose: () => void;
  onApply: (entry: SavedPrompt) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export default function SavedPromptsModal({ isOpen, entries, onClose, onApply, onRename, onRemove }: SavedPromptsModalProps) {
  const [draftNames, setDraftNames] = useState<{ [id: string]: string }>({});
  useEffect(() => {
    if (isOpen) setDraftNames({});
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved prompts">
      {!entries.length ? (
        <p className="text-sm text-gray-500 py-6 text-center">No saved prompts yet — use “Save” on the Generate page to keep the current prompt and negative prompt.</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
          {entries.map(entry => {
            const name = draftNames[entry.id] ?? entry.name;
            const dirty = name !== entry.name;
            return (
              <div key={entry.id} className="flex items-start gap-2">
                <div
                  className="flex-1 min-w-0"
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' && dirty) onRename(entry.id, name);
                  }}
                >
                  <TextInput value={name} onChange={v => setDraftNames(d => ({ ...d, [entry.id]: v }))} />
                  <p className="text-xs text-gray-500 truncate mt-0.5" title={entry.negative_prompt ? `${entry.prompt} — negative: ${entry.negative_prompt}` : entry.prompt}>
                    {entry.prompt}
                    {entry.negative_prompt ? ` — negative: ${entry.negative_prompt}` : ''}
                  </p>
                </div>
                <button
                  className="px-2 py-1 rounded-md bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs shrink-0"
                  onClick={() => {
                    onApply(entry);
                    onClose();
                  }}
                >
                  Apply
                </button>
                {dirty && (
                  <button className="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs shrink-0" onClick={() => onRename(entry.id, name)}>
                    Save name
                  </button>
                )}
                <button className="px-1.5 py-1 rounded-md bg-gray-700 hover:bg-red-700 text-white text-xs shrink-0" title="Delete" onClick={() => onRemove(entry.id)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
