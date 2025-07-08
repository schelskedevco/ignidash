# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **ignidash-v2**, a Next.js 15.3.5 application using the App Router with TypeScript and Tailwind CSS v4. The project follows modern React patterns with strict TypeScript configuration and comprehensive code quality tooling.

## Essential Commands

### Development

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking without output
```

### Code Quality

- Pre-commit hooks automatically run ESLint (with fixes) and Prettier on staged files
- All commits are automatically formatted and linted before being accepted
- ESLint uses flat config format - modify `eslint.config.mjs`, not `.eslintrc`
- Always run the format command after making changes.

## Architecture & Key Patterns

### App Router Structure

- Uses `src/app/` directory structure (not pages router)
- Root layout in `src/app/layout.tsx` configures Geist fonts and global CSS
- Path aliases: `@/*` maps to `./src/*`
- CSS variables for theming (light/dark mode support built-in)

### Styling Architecture

- **Tailwind CSS v4** with modern `@import "tailwindcss"` syntax
- Prettier automatically sorts Tailwind classes via `prettier-plugin-tailwindcss`
- Global styles in `src/app/globals.css` with CSS custom properties
- VS Code configured for Tailwind IntelliSense with `clsx` and `cn` utility support

### TypeScript Configuration

- Strict mode enabled with incremental compilation
- Path aliases configured for clean imports
- React 19 types included

### Code Quality Stack

- **ESLint**: Next.js core-web-vitals + TypeScript + Prettier integration
- **Prettier**: Configured with Tailwind plugin for consistent formatting
- **Husky + lint-staged**: Pre-commit hooks prevent bad code from being committed
- **TypeScript**: Strict type checking with dedicated `typecheck` script

## Key Configuration Files

- `next.config.ts` - Next.js configuration (currently minimal)
- `tsconfig.json` - TypeScript config with path aliases and strict mode
- `eslint.config.mjs` - Modern flat config with ignore patterns
- `postcss.config.mjs` - PostCSS with Tailwind CSS
- `.prettierrc` - Prettier config with Tailwind plugin
- `.husky/pre-commit` - Git hook running lint-staged

## Development Notes

- The project is freshly initialized with Next.js starter content
- All tooling is configured for immediate productive development
- Pre-commit hooks ensure code quality - use `--no-verify` only for emergencies
- Tailwind CSS v4 uses the new syntax - imports are handled in `globals.css`
- ESLint ignores build artifacts, config files, and dependencies via the `ignores` property
