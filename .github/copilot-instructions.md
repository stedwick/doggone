<!-- .github/copilot-instructions.md: Guidance for AI coding agents working on the `doggone` codebase -->

# Quick orientation

This is a small browser game built with Phaser 3 and TypeScript. Key characteristics:

- Entry point: `src/main.ts` — bootstraps a Phaser.Game with scenes `BootScene` and `MainScene`.
- Game code lives under `src/game/`:
  - `scenes/` contains Phaser Scene classes (scene lifecycle, asset loading, orchestration).
  - `logic/` contains pure, testable helpers (movement, inventory, dialogue). Prefer editing logic here for unit tests.
  - `types.ts` defines shared types like `InventoryItem` and `InteractionConfig`.

# What to change and where

- UI, rendering and game object lifecycle: modify `src/game/scenes/*`.
- Gameplay rules, deterministic behavior and pure functions: modify `src/game/logic/*` (these have unit tests).
- Shared shapes and small domain models: `src/game/types.ts`.

# Project-specific conventions

- Keep pure logic in `src/game/logic` (no Phaser API usage). These functions are small and directly unit-tested (see `*.test.ts`).
- Scene files should handle Phaser lifecycle methods (preload, create, update) and delegate logic to helpers in `logic/`.
- Avoid coupling logic helpers to Phaser types — pass primitive inputs/outputs (vectors, state objects) so tests remain simple.
- Tests use Vitest with `jsdom` environment. Test files live alongside sources as `*.test.ts` under `src/game/logic` and are included by Vitest config.

# Build & dev workflows (commands)

- Install deps: npm install
- Start dev server (hot-reload): npm run dev
- Build for production: npm run build
- Run tests: npm run test
- Linting: npm run lint

# Testing patterns & examples

- Unit-test the helpers in `src/game/logic`. Examples:
  - `movement.test.ts` asserts vector normalization for diagonal movement using `resolveMovementVector`.
  - `inventory.test.ts` covers inventory uniqueness and label formatting for `createInventory`, `addItemToInventory` and `formatInventoryLabel`.
  - `dialogue.test.ts` verifies sequential dialogue progression for `createDialogueState` and `getNextDialogueLine`.

# Common pitfalls for AI edits

- Do not move rendering or Phaser-specific code into `logic/` — keep logic library framework-agnostic.
- When changing types in `src/game/types.ts`, update all references and relevant tests.
- `tsconfig.json` uses bundler resolution and strict settings; ensure TypeScript errors are addressed.

# Helpful code examples to reference

- Normalize diagonal movement (important game UX): `src/game/logic/movement.ts` — the function `resolveMovementVector` returns normalized vectors using Math.SQRT1_2.
- Inventory state helpers: `src/game/logic/inventory.ts` — immutable updates and `formatInventoryLabel` for UI text.
- Dialogue iterator: `src/game/logic/dialogue.ts` — pure state machine returning next line and done flag.

# Integration & external deps

- Phaser 3 is the only runtime dependency (package.json). Scenes interact with Phaser and should be the only modules importing Phaser.
- Dev tooling: Vite for dev server/build, TypeScript for types, Vitest for tests.

# Editing guidance for PRs

- Small focused PRs preferred: change one system at a time (logic, scene, or types).
- Include or update unit tests for any behavioral change in `logic/`.
- Run `npm run test` locally and fix any TypeScript errors before submitting.

# If you're unsure

- For runtime behavior questions, inspect `src/main.ts` and `src/game/scenes/*` to see how systems are wired.
- For data shape or helper expectations, open `src/game/types.ts` and `src/game/logic/*` tests for canonical examples.

-- End of file
