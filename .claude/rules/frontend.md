---
description: Frontend conventions for all React components and pages in src/
globs: src/**/*.tsx,src/**/*.ts
---

# TFT Doctor Frontend Rules

## Component Patterns

- **shadcn/ui components**: Always use `Button`, `Card`, `Badge`, `Input`, `Command`, `Dialog`, `Tooltip`, `Skeleton` from `@/components/ui/`. Never use vanilla `<button>`, `<input>`, or build custom equivalents.
- **Icons**: Use `lucide-react` for all icons. Import individually (e.g., `import { Search } from "lucide-react"`).
- **Images**: Use `next/image` with `unoptimized` for all DDragon/CDragon external images. Never use raw `<img>` tags.

## Server vs Client Components

- **Default to server components**. Only add `"use client"` when the component needs:
  - React hooks (`useState`, `useEffect`, `useCallback`, etc.)
  - Browser APIs (`window`, `document`, event listeners)
  - Interactive event handlers (`onClick`, `onChange`, etc.)
- **Never import** `src/lib/db/`, `src/lib/riot/client`, or any server-only module in a `"use client"` component.
- **Environment variables**: `RIOT_API_KEY` and `DATABASE_URL` must NEVER be used in client components. Only `NEXT_PUBLIC_*` vars are safe client-side.

## Tailwind CSS

- Use Tailwind utility classes, not custom CSS (except in `globals.css`).
- Use shadcn/ui's CSS variables for all colors (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-primary`, etc.). Never hardcode hex colors.
- Responsive: mobile-first approach. Use `sm:`, `md:`, `lg:` breakpoints.
- Dark mode is always active (class `dark` on `<html>`). All color tokens are defined in `globals.css` under `.dark`.

## Data Fetching

- **API routes** (`src/app/api/`) handle all data access. Client components fetch via `fetch()` to these routes.
- **Mock data**: When `USE_MOCK_DATA` is true, API routes return from `src/lib/mock-data.ts`. When false, they use Drizzle DB queries.
- **Hooks**: Use custom hooks in `src/hooks/` for data fetching with loading/error state management.

## TypeScript

- Strict mode enabled. No `any` types.
- Import types from `@/types/` for all game entities, API contracts, and Riot API types.
- Prefer `interface` for object shapes, `type` for unions and intersections.
