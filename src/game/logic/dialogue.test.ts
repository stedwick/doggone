import { describe, expect, it } from 'vitest';
import { createDialogueState, getNextDialogueLine } from './dialogue';

describe('dialogue flow', () => {
  it('returns dialogue lines sequentially then signals completion', () => {
    const state = createDialogueState(['Line 1', 'Line 2']);

    const first = getNextDialogueLine(state);
    expect(first.line).toBe('Line 1');
    expect(first.done).toBe(false);

    const second = getNextDialogueLine(first.nextState);
    expect(second.line).toBe('Line 2');
    expect(second.done).toBe(true);

    const end = getNextDialogueLine(second.nextState);
    expect(end.line).toBeNull();
    expect(end.done).toBe(true);
  });
});
