import { describe, expect, it } from 'vitest';
import { resolveMovementVector } from './movement';

describe('resolveMovementVector', () => {
  it('normalizes diagonal intent to maintain consistent speed', () => {
    const vector = resolveMovementVector({ up: true, down: false, left: true, right: false });

    expect(vector.x).toBeCloseTo(-Math.SQRT1_2);
    expect(vector.y).toBeCloseTo(-Math.SQRT1_2);
  });
});
