# TeleCat Copilot Instructions

## Architecture Overview

**TeleCat** is a hybrid desktop/web teleprompter app built with:
- **Frontend**: Nuxt 4 + Vue 3 + TypeScript (SPA mode, no SSR)
- **Desktop**: Tauri 2 (Rust backend) for native distribution
- **Editor**: TipTap (ProseMirror-based) with markdown support
- **State**: Pinia store with persistent settings
- **Styling**: Sass + utility classes, custom CSS properties for theming

## Key Project Structure

```
app/                    # Nuxt application root
├── components/         # Vue components (Design/, Layout/, Markdown/)
├── composables/        # Reusable logic (file conversion, keyboard controls)
├── pages/             # Route pages (index.vue = main teleprompter)
└── stores/store.ts    # Central Pinia state management

backend/               # Hocuspocus collaboration server (optional)
src-tauri/            # Rust desktop application wrapper
scripts/              # Build automation (prebuild.js, postbuild.js)
```

## Development Workflows

### Primary Commands
```bash
pnpm dev              # Web development server
pnpm tauri:dev        # Desktop app with hot reload
pnpm tauri:build      # Production desktop build
pnpm generate         # Static site generation for web
```

### Build System Quirks
- **Dual deployment**: Web (GitHub Pages) + Desktop (Tauri)
- **Pre/post build scripts**: Automatically modify `nuxt.config.ts` and `tauri.conf.json`
  - prebuild: Removes `/TeleCat/` baseURL for desktop builds
  - postbuild: Restores `/TeleCat/` baseURL for web deployment
- **Never manually edit configs during build** - let scripts handle path switching

## Critical Patterns

### State Management (`app/stores/store.ts`)
```typescript
// Central store contains ALL app state
{
  previewState: boolean,     // Edit vs Preview mode toggle
  playState: boolean,        // Scrolling active/paused
  textContent: string,       // HTML content from TipTap
  settings: {
    colorTheme, colorBackground, // Theme colors as CSS custom props
    keyboardControls: [...],      // Dynamic keyboard shortcuts
    direction: boolean,           // Scroll up/down
    websocketServer: {...}        // Collaboration server config
  }
}
```

### Component Communication
- **No props drilling**: Use `useStore()` directly in components
- **Keyboard handling**: Global via `useKeyboardControls()` composable
- **Theme system**: CSS custom properties updated reactively from store

### TipTap Editor Integration
- **Content sync**: Store `textContent` ↔ TipTap editor state
- **Dual modes**: Same editor component for edit/preview with CSS transforms
- **Markdown**: TipTap with markdown serialization, not direct markdown parsing

## File Handling System

**Key composable**: `useTelecatFileHandler.ts` + `useFileConverter.ts`

```typescript
// Supported formats
.telecat    // Native JSON format (complete app state)
.md         // Markdown export/import  
.pdf        // Export only
.docx       // Export only
```

**Pattern**: Always preserve complete app state in `.telecat` format, other formats are content-only.

## Tauri Integration Points

### File System Access
```typescript
// Use Tauri plugins, not web APIs
import { open } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
```

### Window Management
- Fullscreen toggle via `toggleFullscreen()` store action
- Responsive design handles both web and desktop viewports
- Desktop-specific: Drag-drop enabled, custom window decorations

## Styling Architecture

### Theme System
Can be dynamically updated from store.ts
```sass
// CSS custom properties drive theming
:root
    --color_p: #{$nOrange}
    --color_bg: #{$BGcolor}
    --text_color: #{$TextColor}
    --highlight_color: #fff59e
```


### Typography Scaling
Is defined in store settings for user customization:
```typescript
// Dynamic font scaling based on store settings
fontScale: 3,      // Base multiplier
h1Scale: 4.5,      // Header scaling
editFontScale: 1.5 // Editor mode scaling
```

## Development Gotchas

1. **Module Resolution**: Use `@/` prefix for app directory imports
2. **Tauri Dev URLs**: Different ports/paths for web vs desktop (handled by scripts)
3. **No SSR**: All rendering happens client-side (`ssr: false`)
4. **PNPM Only**: Enforced via preinstall script - don't use npm/yarn
5. **Keyboard Conflicts**: Shortcuts disabled in edit mode, active in preview mode
6. **Collaboration**: WebSocket server is optional feature, code prepared but currently disabled so please ignore for now

## Testing & Debugging

- **No test suite**: Manual testing required
- **Preview builds**: Use `pnpm generate` + serve dist for web testing
- **Desktop debugging**: `pnpm tauri:build:debug` for debug builds
- **Console access**: Both browser devtools and Tauri console available

## Deployment

- **Web**: GitHub Pages via `pnpm deploy` (automatic baseURL handling)
- **Desktop**: Manual release via GitHub Releases (binaries from `tauri:build`)
- **Version sync**: Keep `package.json` version aligned with Tauri config