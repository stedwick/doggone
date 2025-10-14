import { describe, expect, it } from 'vitest';
import { addItemToInventory, createInventory, formatInventoryLabel } from './inventory';

describe('inventory helpers', () => {
  it('stores unique items and formats inventory label', () => {
    const empty = createInventory();

    const withHat = addItemToInventory(empty, {
      id: 'wizard-hat',
      name: 'Wizard Hat',
      description: 'Wizardry for dogs.',
      equipped: true,
    });

    const withDuplicate = addItemToInventory(withHat, {
      id: 'wizard-hat',
      name: 'Wizard Hat',
      description: 'Duplicate wizardry.',
      equipped: true,
    });

    expect(withHat.items).toHaveLength(1);
    expect(withDuplicate.items).toHaveLength(1);
    expect(formatInventoryLabel(withHat)).toBe('Inventory: Wizard Hat (equipped)');
  });
});
