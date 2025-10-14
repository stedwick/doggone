export interface MovementInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface MovementVector {
  x: number;
  y: number;
}

const ZERO_VECTOR: MovementVector = { x: 0, y: 0 };

export function resolveMovementVector(input: MovementInput): MovementVector {
  const vertical = Number(input.down) - Number(input.up);
  const horizontal = Number(input.right) - Number(input.left);

  if (vertical === 0 && horizontal === 0) {
    return ZERO_VECTOR;
  }

  if (vertical !== 0 && horizontal !== 0) {
    const normalized = Math.SQRT1_2;
    return { x: horizontal * normalized, y: vertical * normalized };
  }

  return { x: horizontal, y: vertical };
}
