# CLAUDE.md - AI Assistant Guide for mybias-web

## Project Overview

**mybias-web** is a modern React web application built with TypeScript and Vite. This is a frontend-focused project using React 19 with cutting-edge features including the React Compiler for automatic optimization.

**Project Type:** Single Page Application (SPA)
**Package Manager:** Bun (lockfile: `bun.lockb`)
**Build Tool:** Vite 7.x
**Framework:** React 19.2.0
**Language:** TypeScript 5.9.x

## Tech Stack

### Core Dependencies
- **React 19.2.0** - Latest React with modern features
- **React DOM 19.2.0** - DOM rendering for React
- **TypeScript 5.9.3** - Strict type checking enabled
- **Vite 7.2.4** - Ultra-fast build tool with HMR (Hot Module Replacement)
- **Tailwind CSS** - Utility-first CSS framework (all styling uses Tailwind classes)

### Development Tools
- **ESLint** - Code linting with comprehensive React rules
- **React Compiler** - Automatic React optimization (babel-plugin-react-compiler)
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Vite Plugin React** - React Fast Refresh support

### ESLint Plugins
- `@eslint/js` - Core JavaScript rules
- `eslint-plugin-react-hooks` - Enforces Rules of Hooks
- `eslint-plugin-react-refresh` - Vite-specific React refresh rules
- `eslint-plugin-react-x` - Advanced React linting
- `eslint-plugin-react-dom` - React DOM-specific rules

## Directory Structure

```
mybias-web/
├── src/
│   ├── assets/          # Static assets (images, icons, etc.)
│   ├── App.tsx          # Main application component
│   ├── App.css          # App component styles
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Public static assets (served as-is)
│   └── vite.svg         # Vite logo
├── dist/                # Build output (generated, gitignored)
├── node_modules/        # Dependencies (gitignored)
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── bun.lockb            # Bun lock file
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript project references
├── tsconfig.app.json    # App-specific TypeScript config
├── tsconfig.node.json   # Node/build tools TypeScript config
├── eslint.config.js     # ESLint configuration (flat config)
├── .gitignore           # Git ignore patterns
└── README.md            # Project documentation
```

## Development Workflows

### Available Scripts

```bash
# Development server with HMR
npm run dev        # or: bun run dev
# Starts Vite dev server (default: http://localhost:5173)

# Production build
npm run build      # or: bun run build
# 1. Runs TypeScript compiler check (tsc -b)
# 2. Builds optimized production bundle

# Linting
npm run lint       # or: bun run lint
# Runs ESLint on all files

# Preview production build
npm run preview    # or: bun run preview
# Serves production build locally for testing
```

### Development Process

1. **Start Development:**
   ```bash
   bun run dev
   ```
   - Vite starts with HMR enabled
   - Changes to `.tsx`/`.ts` files trigger fast refresh
   - React Compiler optimizes components automatically

2. **Making Changes:**
   - Edit files in `src/`
   - Changes appear instantly via HMR
   - Check browser console for errors
   - ESLint runs in editor (if configured)

3. **Before Committing:**
   ```bash
   bun run lint      # Check for linting errors
   bun run build     # Ensure build works
   ```

4. **Building for Production:**
   ```bash
   bun run build
   bun run preview   # Test production build locally
   ```

## TypeScript Configuration

### Compiler Options (tsconfig.app.json)

**Strictness:**
- `strict: true` - All strict type-checking enabled
- `noUnusedLocals: true` - Error on unused local variables
- `noUnusedParameters: true` - Error on unused function parameters
- `noFallthroughCasesInSwitch: true` - Prevent switch fallthrough bugs
- `noUncheckedSideEffectImports: true` - Type-check side-effect imports

**Module System:**
- `target: "ES2022"` - Modern JavaScript output
- `module: "ESNext"` - Latest ECMAScript modules
- `moduleResolution: "bundler"` - Vite-optimized resolution
- `jsx: "react-jsx"` - Modern React JSX transform (no React import needed)

**Important Settings:**
- `verbatimModuleSyntax: true` - Type-only imports must use `type` keyword
- `allowImportingTsExtensions: true` - Can import `.ts`/`.tsx` files directly
- `noEmit: true` - TypeScript only for type checking (Vite handles bundling)

### Project References
The project uses TypeScript project references:
- `tsconfig.json` - Root configuration with references
- `tsconfig.app.json` - Application code (`src/`)
- `tsconfig.node.json` - Build tools and config files

## Linting & Code Quality

### ESLint Configuration (eslint.config.js)

Uses **Flat Config** format (modern ESLint 9.x style).

**Enabled Rulesets:**
- `@eslint/js` recommended - Core JavaScript rules
- `typescript-eslint` recommended - TypeScript best practices
- `react-hooks` recommended - React Hooks rules
- `react-refresh` Vite config - Fast refresh compatibility
- `react-x` recommended - Advanced React patterns
- `react-dom` recommended - DOM-specific React rules

**Custom Rules:**
- `react-x/no-class-component: "warn"` - Prefer function components
- `react-dom/no-dangerously-set-innerhtml: "warn"` - Security warning for XSS

**Parser Options:**
- Uses `projectService: true` for type-aware linting
- Configured for browser globals
- ECMAScript 2020 features

### Code Style Guidelines

1. **Prefer Function Components:**
   ```tsx
   // ✅ Good
   function MyComponent() { ... }
   const MyComponent = () => { ... }

   // ⚠️ Warned
   class MyComponent extends React.Component { ... }
   ```

2. **TypeScript Strictness:**
   - Always provide types for function parameters
   - Use return type annotations for complex functions
   - Avoid `any` types
   - Use type-only imports when importing just types:
     ```tsx
     import type { MyType } from './types'
     ```

3. **React Hooks Rules:**
   - Only call hooks at top level
   - Only call hooks from React functions
   - Proper dependency arrays for `useEffect`/`useMemo`/`useCallback`

4. **Avoid Dangerous Patterns:**
   - Minimize use of `dangerouslySetInnerHTML`
   - Sanitize user input before rendering

## Vite Configuration

### Key Features (vite.config.ts)

```typescript
{
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
}
```

**React Compiler:**
- Automatically optimizes React components
- Reduces need for manual `useMemo`/`useCallback`
- May impact dev/build performance slightly
- See: https://react.dev/learn/react-compiler

**Vite Features:**
- ⚡ Lightning-fast HMR
- 📦 Optimized production builds
- 🔧 Built-in TypeScript support
- 🎨 CSS/Asset handling
- 🌐 Dev server with proxy support

## Important Files & Patterns

### Entry Points

**HTML Entry:** `index.html`
- Contains `<div id="root"></div>`
- Loads `/src/main.tsx` as module

**JavaScript Entry:** `src/main.tsx`
- Creates React root
- Wraps app in `<StrictMode>`
- Renders `<App />` component

### Asset Handling

**Public Assets:** `public/`
- Served as-is at root path
- Reference with absolute paths: `/vite.svg`

**Imported Assets:** `src/assets/`
- Imported in components: `import logo from './assets/react.svg'`
- Processed by Vite (optimization, cache-busting)

### Styling

**CSS Framework:** Tailwind CSS
- All styles should be written using Tailwind CSS utility classes
- Do NOT create separate CSS files for components
- Global styles and Tailwind directives: `src/index.css`
- Custom theme configuration: `tailwind.config.js`

**Styling Guidelines:**
- Use Tailwind utility classes directly in JSX
- For complex/repeated styles, use template literals or helper functions
- Responsive design: Use Tailwind breakpoints (e.g., `md:`, `lg:`)
- Custom values: Use arbitrary values when needed (e.g., `w-[120px]`, `shadow-[0_10px_40px_rgba(0,0,0,0.3)]`)

## AI Assistant Guidelines

### When Writing Code

1. **Always Use TypeScript:**
   - All new files should be `.tsx` or `.ts`
   - Provide proper type annotations
   - No `any` types without justification

2. **Follow React Best Practices:**
   - Use function components
   - Properly type component props:
     ```tsx
     interface Props {
       name: string;
       count?: number;
     }

     function Component({ name, count = 0 }: Props) { ... }
     ```
   - Use React 19 features appropriately
   - Don't manually optimize with useMemo/useCallback (React Compiler handles this)

3. **Import Conventions:**
   - React imports: `import { useState } from 'react'` (no need to import React itself)
   - Type-only imports: `import type { MyType } from './types'`
   - Asset imports: `import logo from './assets/logo.svg'`

4. **File Organization:**
   - Components in `src/`
   - Create subdirectories as needed: `src/components/`, `src/hooks/`, `src/utils/`
   - Co-locate related files (component + styles + tests)

5. **ESLint Compliance:**
   - Run `bun run lint` before committing
   - Fix all errors, address warnings
   - Don't disable rules without good reason

### Before Making Changes

1. **Check Current Structure:**
   - Look at existing files for patterns
   - Match existing code style
   - Consider impact on build/lint

2. **Verify Changes Work:**
   - Build successfully: `bun run build`
   - No lint errors: `bun run lint`
   - Test in dev mode: `bun run dev`

3. **Type Safety:**
   - TypeScript compiler must pass
   - No type errors in strict mode
   - Proper null/undefined handling

### When Adding Dependencies

```bash
# Add runtime dependency
bun add <package>

# Add dev dependency
bun add -d <package>
```

**Considerations:**
- Check React 19 compatibility
- Prefer TypeScript-native packages
- Update relevant config files if needed (vite.config.ts, tsconfig, etc.)

### Common Patterns

**Creating a New Component:**
```tsx
// src/components/MyComponent.tsx
import { useState } from 'react'
import type { ReactNode } from 'react'

interface MyComponentProps {
  title: string
  children?: ReactNode
}

export function MyComponent({ title, children }: MyComponentProps) {
  const [state, setState] = useState<string>('')

  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export default MyComponent
```

**Custom Hook:**
```tsx
// src/hooks/useCustomHook.ts
import { useState, useEffect } from 'react'

export function useCustomHook(initialValue: string) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    // Effect logic
  }, [value])

  return [value, setValue] as const
}
```

### Git Workflow

**Branch Naming:**
- Feature: `claude/feature-name-<session-id>`
- Fix: `claude/fix-name-<session-id>`

**Commit Messages:**
- Clear, descriptive messages
- Reference what changed and why
- Keep commits focused and atomic

**Before Pushing:**
```bash
bun run lint    # Must pass
bun run build   # Must succeed
```

## Troubleshooting

### Build Fails
1. Check TypeScript errors: `bun run build` shows compiler errors
2. Check for unused imports/variables (strict settings enabled)
3. Verify all files in `src/` are valid TypeScript

### Lint Errors
1. Run `bun run lint` to see all issues
2. Check ESLint rule documentation
3. Fix or justify disabling specific rules

### Type Errors
1. Check `tsconfig.app.json` includes your files
2. Ensure proper type imports
3. Use `verbatimModuleSyntax` correctly (type-only imports need `type` keyword)

### HMR Not Working
1. Check browser console for errors
2. Restart dev server: `bun run dev`
3. Check file is in `src/` directory

## Additional Resources

- **React 19 Docs:** https://react.dev
- **React Compiler:** https://react.dev/learn/react-compiler
- **Vite Docs:** https://vite.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **ESLint Flat Config:** https://eslint.org/docs/latest/use/configure/

## Project Status

This is an early-stage project initialized with a Vite + React + TypeScript template. The codebase currently contains:
- Basic React setup with demo counter component
- Configured build tools and linting
- React Compiler enabled for automatic optimization
- Strict TypeScript configuration
- Modern ESLint setup with comprehensive React rules

AI assistants should maintain these high standards and modern patterns when contributing to the project.
