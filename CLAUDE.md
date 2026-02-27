# TCAD — Garment Pattern CAD

Desktop 2D/3D pattern making and design app for clothes. Built with Tauri v2 + Rust + React.

## Commands

```bash
pnpm dev              # Start Vite dev server
pnpm tauri dev        # Start full Tauri app (Vite + Rust)
pnpm build            # Typecheck + production build
pnpm tauri build      # Build distributable desktop app
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint autofix
pnpm typecheck        # TypeScript type check
pnpm check            # lint + typecheck
pnpm ui:add <name>    # Add shadcn component (e.g. pnpm ui:add button)
pnpm clean            # Remove dist, cache, and Rust target
```

Rust-only:
```bash
cd src-tauri
cargo check           # Check Rust compiles
cargo clippy          # Rust linter
cargo test            # Run Rust tests
```

## Tech Stack

- **Shell**: Tauri v2 (desktop wrapper)
- **Backend**: Rust — all computation, geometry, file I/O
- **Frontend**: Vite + React 19 + TypeScript
- **Styling**: Tailwind v4 + shadcn/ui (nova style, neutral base, pink theme)
- **Icons**: Hugeicons (`@hugeicons/core-free-icons` + `@hugeicons/react`)
- **Font**: Outfit (`@fontsource-variable/outfit`)
- **Data layer**: TanStack Query v5 wrapping Tauri `invoke()` calls
- **UI state**: React Context (tool, selection, viewport, workspace, project)
- **3D**: Three.js + React Three Fiber + drei
- **2D**: Raw HTML Canvas (pan/zoom, tool dispatch, rAF render loop)
- **Linting**: @antfu/eslint-config (double quotes, semicolons, 2-space indent)
- **Package manager**: pnpm

## Project Structure

### Frontend (`src/`)

```
src/
├── main.tsx                    # React root
├── app.tsx                     # Top-level: providers + layout
├── index.css                   # Tailwind + shadcn theme variables
├── components/                 # GLOBAL shared components
│   ├── ui/                     # shadcn/ui generated components (DO NOT edit manually)
│   ├── providers/              # React context providers (theme, etc.)
│   └── theme-toggle.tsx        # Example global component
├── features/                   # DOMAIN-SPECIFIC features
│   └── {domain}/               # e.g. canvas/, viewport3d/, pattern/
│       ├── components/         # Components scoped to this feature
│       ├── hooks/              # Hooks scoped to this feature
│       └── lib/                # Utilities scoped to this feature
├── hooks/                      # GLOBAL shared hooks
├── lib/                        # GLOBAL utilities
│   ├── utils.ts                # shadcn cn() utility
│   ├── query-client.ts         # TanStack QueryClient config
│   ├── query-keys.ts           # Query key factory
│   ├── invoke.ts               # Typed Tauri invoke wrappers
│   ├── constants.ts            # App-wide constants
│   └── math.ts                 # Client-side math helpers
├── contexts/                   # React context definitions
└── types/                      # TypeScript types mirroring Rust structs
```

### Backend (`src-tauri/src/`)

```
src-tauri/src/
├── main.rs                     # Desktop entry point
├── lib.rs                      # Tauri Builder, command registration
├── commands/                   # Tauri command handlers (thin, no business logic)
│   ├── pattern.rs              # CRUD for pattern pieces
│   ├── geometry.rs             # Seam allowance, validation, area
│   ├── mesh.rs                 # 3D mesh generation
│   └── export.rs               # SVG/DXF export
├── engine/                     # Core domain logic (pure Rust, no Tauri dependency)
│   ├── pattern_piece.rs        # Pattern piece operations + in-memory store
│   ├── seam.rs                 # Seam allowance computation
│   └── validation.rs           # Geometry validation + area computation
├── geometry/                   # Low-level math primitives (no domain awareness)
│   ├── vec2.rs                 # 2D vector with ops
│   ├── vec3.rs                 # 3D vector with ops
│   ├── bbox.rs                 # Axis-aligned bounding box
│   ├── transform.rs            # 2D affine transforms
│   ├── intersection.rs         # Segment/ray intersection
│   └── tessellation.rs         # Lyon-based path tessellation
├── mesh/                       # 3D mesh generation
│   └── generator.rs            # 2D patterns → flat 3D mesh
└── types/                      # Shared serde types (source of truth for TS mirrors)
    ├── error.rs                # AppError, AppResult
    ├── pattern.rs              # PatternPieceData, CurveSegment, Point2D
    └── mesh.rs                 # MeshData (flat buffer arrays)
```

## Conventions

### Frontend

- **File naming**: kebab-case everywhere (`theme-toggle.tsx`, not `ThemeToggle.tsx`). Enforced by ESLint.
- **Component naming**: PascalCase exports (`export function ThemeToggle()`), kebab-case files.
- **Global vs feature**: Global components go in `src/components/`. Domain-specific code goes in `src/features/{domain}/`. A component is "global" if it's used across 2+ features.
- **shadcn components**: Live in `src/components/ui/`. Added via `pnpm ui:add <name>`. Do not manually edit — override via wrapper components if needed.
- **Icons**: Use Hugeicons. Import icons from `@hugeicons/core-free-icons`, render with `<HugeiconsIcon>` from `@hugeicons/react`.
- **Imports**: Auto-sorted by eslint-plugin-perfectionist. Types import first, then external, then internal.
- **State management**: TanStack Query for Rust backend data. React Context for UI state (tool, selection, viewport). No Zustand/Redux.
- **Tauri IPC**: All `invoke()` calls go through typed wrappers in `src/lib/invoke.ts`. Never call `invoke()` directly in components — use TanStack Query hooks.
- **Types**: TypeScript types that mirror Rust structs live in `src/types/`. Keep them manually in sync with `src-tauri/src/types/`.

### Backend (Rust)

- **Commands** (`commands/`): Thin `#[tauri::command]` handlers. Parse args, call engine, return result. No business logic here.
- **Engine** (`engine/`): Pure domain logic. No Tauri imports. Must be independently testable with `cargo test`.
- **Geometry** (`geometry/`): Pure math. No domain awareness — knows about vectors and transforms, not "pattern pieces".
- **Mesh** (`mesh/`): Converts 2D outlines to 3D triangle mesh data for the frontend.
- **Types** (`types/`): All types that cross the IPC bridge. Must derive `Serialize` + `Deserialize`. This is the source of truth that TypeScript mirrors.
- **Error handling**: Commands return `Result<T, String>` (Tauri IPC requirement). Internal code uses `AppError` enum, converted to `String` at the command boundary.
- **Naming**: snake_case for everything (Rust standard). Module files match their purpose (`pattern_piece.rs`, not `pattern-piece.rs`).
- **New commands**: Add the function in the appropriate `commands/*.rs` file, then register it in `lib.rs` under `tauri::generate_handler![]`.

### Data Flow

```
User interaction (Canvas/Viewport)
  → Tool handler (local state for drag responsiveness)
  → On commit (pointer-up): TanStack Mutation → invoke() → Rust command
  → Rust engine processes, returns result
  → Mutation onSuccess: invalidate query keys
  → Canvas2D + Viewport3D re-render from fresh query data
```

Canvas renders local state during drag operations. Rust round-trip only happens on pointer-up (commit). This avoids IPC latency during interactive editing.

### Adding a New Feature

1. Create `src/features/{name}/` with `components/`, `hooks/`, `lib/` subdirs as needed
2. If it needs Rust commands: add command in `src-tauri/src/commands/`, register in `lib.rs`
3. Add typed invoke wrapper in `src/lib/invoke.ts`
4. Add query keys in `src/lib/query-keys.ts`
5. Create TanStack Query hook in the feature's `hooks/` dir
6. Mirror any new Rust types in `src/types/`

### Pre-commit

Husky runs `lint-staged` on commit, which auto-fixes ESLint issues on staged `.ts/.tsx` files.
