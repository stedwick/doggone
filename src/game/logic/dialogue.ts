export interface DialogueState {
  lines: string[];
  index: number;
}

export function createDialogueState(lines: string[]): DialogueState {
  return { lines: [...lines], index: 0 };
}

export function getNextDialogueLine(state: DialogueState): { line: string | null; done: boolean; nextState: DialogueState } {
  if (state.index >= state.lines.length) {
    return { line: null, done: true, nextState: state };
  }

  const line = state.lines[state.index];
  const nextState: DialogueState = { lines: state.lines, index: state.index + 1 };
  const done = nextState.index >= nextState.lines.length;

  return { line, done, nextState };
}
