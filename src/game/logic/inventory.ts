import type { InventoryItem } from '../types';

export interface InventoryState {
  items: InventoryItem[];
}

export function createInventory(initialItems: InventoryItem[] = []): InventoryState {
  return { items: [...initialItems] };
}

export function addItemToInventory(state: InventoryState, item: InventoryItem): InventoryState {
  const exists = state.items.some((existing) => existing.id === item.id);

  if (exists) {
    return state;
  }

  return { items: [...state.items, item] };
}

export function formatInventoryLabel(state: InventoryState): string {
  if (state.items.length === 0) {
    return 'Inventory: (empty)';
  }

  const itemNames = state.items.map((entry) => {
    const equippedSuffix = entry.equipped ? ' (equipped)' : '';
    return `${entry.name}${equippedSuffix}`;
  });

  return `Inventory: ${itemNames.join(', ')}`;
}
