# TCAD

Desktop 2D/3D garment pattern CAD. Draw, edit, and export sewing patterns with a split canvas/3D view.

Built with **Tauri v2** (Rust backend) + **React** (TypeScript frontend).

## Features

- **2D Canvas** - Draw pattern pieces with line, curve, and pen tools. Pan/zoom, adaptive grid, selection, drag-move.
- **3D Viewport** - Live mesh preview of pattern pieces via Three.js. Auto-framing camera, selection sync with 2D.
- **Geometry Engine** - Seam allowance, validation, area computation - all in Rust.
- **Persistence** - Project save/load (`.tcad`), undo/redo (100 states), auto-recovery on crash.
- **Export** - SVG, DXF (R12), and tiled PDF (A4/Letter with alignment crosshairs).

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                  │
│                                                 │
│  Canvas2D ◄──── Zustand stores ────► Viewport3D │
│     │           (tool, selection,        │      │
│     │            workspace, project)     │      │
│     ▼                                    ▼      │
│  Tool dispatch          React Three Fiber/drei  │
│     │                                           │
│     ▼                                           │
│  TanStack Query ──► invoke() wrappers           │
└──────────────────────┬──────────────────────────┘
                       │ Tauri IPC (JSON)
┌──────────────────────▼──────────────────────────┐
│  Backend (Rust)                                 │
│                                                 │
│  commands/  ──► engine/  ──► geometry/          │
│  (thin IPC)    (domain)     (math primitives)   │
│                    │                            │
│                    ├──► mesh/ (3D triangulation) │
│                    └──► types/ (shared serde)    │
└─────────────────────────────────────────────────┘
```

**Data flow:** User interaction → local state (drag responsiveness) → pointer-up commit → TanStack mutation → Rust command → engine processes → mutation invalidates queries → canvas/viewport re-render.

## Project Structure

### Frontend (`src/`)

```
src/
├── app.tsx                         # Providers, layout, recovery check
├── features/
│   ├── canvas/                     # 2D canvas: render loop, tools, hit-testing
│   ├── pattern/                    # Pattern CRUD hooks, queries, mutations
│   └── viewport3d/                 # 3D preview: R3F scene, mesh, camera
├── stores/                         # Zustand: tool, selection, workspace, project
├── lib/
│   ├── invoke.ts                   # Typed Tauri IPC wrappers
│   ├── query-keys.ts               # TanStack query key factory
│   └── query-client.ts             # QueryClient config
├── types/                          # TS mirrors of Rust serde structs
└── components/
    ├── ui/                         # shadcn/ui (generated, don't edit)
    └── layout/                     # Toolbar, sidebar, status bar
```

### Backend (`src-tauri/src/`)

```
src-tauri/src/
├── commands/                       # Tauri command handlers (thin, no logic)
│   ├── pattern.rs                  #   CRUD for pattern pieces
│   ├── geometry.rs                 #   Seam allowance, validation, area
│   ├── mesh.rs                     #   3D mesh generation
│   ├── history.rs                  #   Undo/redo
│   ├── project.rs                  #   Save/load/recovery
│   └── export.rs                   #   SVG, DXF, PDF export
├── engine/                         # Domain logic (pure Rust, no Tauri deps)
│   ├── pattern_piece.rs            #   In-memory pattern store + ops
│   ├── seam.rs                     #   Seam allowance computation
│   ├── validation.rs               #   Geometry validation
│   ├── history.rs                  #   Undo/redo stacks
│   ├── project.rs                  #   .tcad file format
│   └── export.rs                   #   SVG/DXF/PDF generation
├── geometry/                       # Math primitives (no domain awareness)
│   ├── vec2.rs, vec3.rs            #   2D/3D vectors
│   ├── bbox.rs                     #   Bounding box
│   ├── transform.rs                #   Affine transforms
│   ├── intersection.rs             #   Segment/ray intersection
│   └── tessellation.rs             #   Lyon path tessellation
├── mesh/
│   └── generator.rs                #   2D outlines → 3D triangle mesh
└── types/                          # Shared serde types (source of truth)
    ├── pattern.rs                  #   PatternPieceData, CurveSegment, Point2D
    ├── mesh.rs                     #   MeshData (flat buffer arrays)
    └── error.rs                    #   AppError, AppResult
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Shell | Tauri v2 |
| Backend | Rust |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind v4, shadcn/ui |
| Data | TanStack Query v5 |
| UI State | Zustand |
| 3D | Three.js, React Three Fiber, drei |
| 2D | HTML Canvas (custom render loop) |
| Export | SVG, DXF (R12), PDF (printpdf) |

## Development

```bash
pnpm install              # Install dependencies
pnpm tauri dev            # Start full Tauri app (Vite + Rust)
pnpm tauri build          # Build distributable desktop app
pnpm dev                  # Start Vite dev server only
pnpm build                # Typecheck + Vite production build
pnpm lint                 # ESLint check
pnpm lint:fix             # ESLint autofix
pnpm typecheck            # TypeScript type check
pnpm check                # lint + typecheck
pnpm ui:add <name>        # Add shadcn component
pnpm clean                # Remove dist, cache, and Rust target
```

Rust-only:

```bash
cd src-tauri
cargo check               # Check Rust compiles
cargo clippy              # Rust linter
cargo test                # Run Rust tests
```

## License

MIT
