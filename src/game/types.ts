export type InputDirection = 'up' | 'down' | 'left' | 'right';

export type InputMethod = 'wasd' | 'arrows' | 'virtual';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  equipped?: boolean;
}

export interface InteractionConfig {
  type: 'item' | 'dialogue';
  itemId?: string;
  dialogue?: string[];
  once?: boolean;
}
