# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + Vite configuration file converter that supports bidirectional conversion between environment variable
formats and specialized conversions from Docker Compose to Spring Boot configurations.

## Common Commands

### Development

```bash

# Install dependencies (use pnpm as specified in user config)
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Testing

```bash
# Run unit tests (Vitest)
pnpm run test:unit

# Run E2E tests (Playwright - first time: npx playwright install)
pnpm run test:e2e
```

### Code Quality

```bash
# Run all linting (ESLint + Oxlint + Prettier)
pnpm run lint

# Format code with Prettier
pnpm run format

# Type checking
pnpm run type-check
```

## Architecture

### Core Structure

- **Frontend**: Vue 3 SPA with TypeScript
- **Build**: Vite with Vue plugin
- **State**: Pinia for state management
- **Routing**: Vue Router for navigation
- **Testing**: Vitest for unit tests, Playwright for E2E

### Key Components & Utilities

#### `src/utils/envConvert.ts`

Handles conversion between environment variable formats:

- Supported formats: IntelliJ IDEA, .env, Linux Shell
- Core functions: `parseToPairs()`, `generateFromPairs()`, `convert()`
- Handles quote escaping and value serialization

#### `src/utils/composeToSpring.ts`

Parses Docker Compose configurations and generates Spring Boot configs:

- Parses MySQL and Redis services from Compose YAML
- Outputs: Spring YAML, Spring properties, Spring environment variables
- Core functions: `parseComposeToServiceConfig()`, `composeToSpring()`

#### `src/components/EnvConverter.vue`

Main UI component providing:

- Dual-pane editor interface
- Format selection dropdowns
- Conversion buttons and format swapping
- Responsive layout (stacked on portrait, side-by-side on landscape)

### Conversion Flow

1. **Environment variables**: Bidirectional conversion between IDEA/.env/Linux formats
2. **Docker Compose → Spring**: Unidirectional conversion parsing Compose YAML to generate Spring configurations
3. **UI interaction**: Left-to-right or right-to-left conversion with format validation

### Testing Strategy

- Unit tests cover conversion logic with edge cases
- E2E tests validate full user workflows
- Tests located in `src/__tests__/` directory

### Important Constraints

- Docker Compose parsing uses line-by-line scanning (not full YAML AST)
- Only supports MySQL and Redis services with common configuration fields
- Quote/escape handling is simplified and may not handle all edge cases
- Compose to Spring conversion is unidirectional only

## Development Notes

- The project uses TypeScript throughout
- Component structure is minimal with a single main converter component
- Responsive design adapts to mobile/desktop layouts
- Error handling is basic - input validation is minimal
- Production deployment should include manual verification of generated configs