# AI Rules for 10xDevs Project

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- Supabase (backend, auth, database)

## Project Structure

```
./src                       - source code
./src/layouts               - Astro layouts
./src/pages                 - Astro pages
./src/pages/api             - API endpoints
./src/middleware/index.ts   - Astro middleware
./src/db                    - Supabase clients and types
./src/types.ts              - Shared types for backend and frontend (Entities, DTOs)
./src/components            - Client-side components (Astro static, React dynamic)
./src/components/ui         - Shadcn/ui components
./src/components/hooks      - Custom React hooks
./src/lib                   - Services and helpers
./src/lib/services          - Extracted business logic
./src/assets                - Static internal assets
./public                    - Public assets
./supabase/migrations       - Database migrations
```

## Coding Practices

### Code Formatting (Prettier)

**IMPORTANT:** Always follow Prettier configuration from `.prettierrc.json`

Configuration:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 120,
  "trailingComma": "es5"
}
```

**Rules to follow when writing code:**

- ✅ **Use DOUBLE quotes** (`"`) for strings - NOT single quotes (`'`)

  ```typescript
  // ✅ CORRECT
  import { Button } from "@/components/ui/button";
  const message = "Hello World";

  // ❌ WRONG - DO NOT USE SINGLE QUOTES
  import { Button } from "@/components/ui/button";
  const message = "Hello World";
  ```

- ✅ **Always use semicolons** (`;`) at the end of statements

  ```typescript
  // ✅ CORRECT
  const foo = "bar";

  // ❌ WRONG - MISSING SEMICOLON
  const foo = "bar";
  ```

- ✅ **Use trailing commas** in objects and arrays (ES5 style)

  ```typescript
  // ✅ CORRECT
  const obj = {
    name: "John",
    age: 30,
  };

  // ❌ WRONG - MISSING TRAILING COMMA
  const obj = {
    name: "John",
    age: 30,
  };
  ```

- ✅ **Use 2 spaces for indentation** (not tabs)

- ✅ **Maximum line width: 120 characters**
  - Break long lines into multiple lines if needed
  - Prettier will format automatically

- ✅ **Arrow functions: use parentheses around parameters**

  ```typescript
  // ✅ CORRECT
  const map = items.map((item) => item.name);

  // ❌ WRONG - MISSING PARENTHESES (Prettier will fix)
  const map = items.map((item) => item.name);
  ```

**Running Prettier:**

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check
```

### Clean Code Guidelines

- Use feedback from linters to improve the code when making changes
- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability
- Avoid unnecessary else statements; use if-return pattern instead
- Use guard clauses to handle preconditions and invalid states early
- Implement proper error logging and user-friendly error messages
- Consider using custom error types or error factories for consistent error handling

---

## Astro Guidelines

- Leverage View Transitions API for smooth page transitions (use ClientRouter)
- Use content collections with type safety for blog posts, documentation, etc.
- Leverage Server Endpoints for API routes
- Use `POST`, `GET` - uppercase format for endpoint handlers
- Use `export const prerender = false` for API routes
- Use zod for input validation in API routes
- Extract logic into services in `src/lib/services`
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use `Astro.cookies` for server-side cookie management
- Leverage `import.meta.env` for environment variables

---

## React Guidelines

- Use functional components with hooks instead of class components
- **Never use "use client" and other Next.js directives** - we use React with Astro
- Extract logic into custom hooks in `src/components/hooks`
- Implement `React.memo()` for expensive components that render often with the same props
- Utilize `React.lazy()` and `Suspense` for code-splitting and performance optimization
- Use `useCallback` hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer `useMemo` for expensive calculations to avoid recomputation on every render
- Implement `useId()` for generating unique IDs for accessibility attributes
- Consider using `useOptimistic` hook for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates to keep the UI responsive

---

## Frontend Guidelines

### General

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed

### Tailwind Styling

- Use the `@layer` directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., `w-[123px]`) for precise one-off designs
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the `theme()` function in CSS for accessing Tailwind theme values
- Implement dark mode with the `dark:` variant
- Use responsive variants (`sm:`, `md:`, `lg:`, etc.) for adaptive designs
- Leverage state variants (`hover:`, `focus-visible:`, `active:`, etc.) for interactive elements

### Accessibility (ARIA Best Practices)

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set `aria-expanded` and `aria-controls` for expandable content like accordions and dropdowns
- Use `aria-live` regions with appropriate politeness settings for dynamic content updates
- Implement `aria-hidden` to hide decorative or duplicative content from screen readers
- Apply `aria-label` or `aria-labelledby` for elements without visible text labels
- Use `aria-describedby` to associate descriptive text with form inputs or complex elements
- Implement `aria-current` for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements

---

## Backend and Database Guidelines

- Use Supabase for backend services, including authentication and database interactions
- Follow Supabase guidelines for security and performance
- Use Zod schemas to validate data exchanged with the backend
- Use supabase from `context.locals` in Astro routes instead of importing supabaseClient directly
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

---

## Supabase Migrations

When creating database migrations:

### File Naming Convention

Create files in `supabase/migrations/` with format: `YYYYMMDDHHmmss_short_description.sql`

Example: `20240906123045_create_profiles.sql`

### SQL Guidelines

- Include a header comment with metadata about the migration (purpose, affected tables/columns, special considerations)
- Include thorough comments explaining the purpose and expected behavior of each migration step
- Write all SQL in lowercase
- Add copious comments for any destructive SQL commands (truncating, dropping, column alterations)
- **Always enable Row Level Security (RLS)** when creating a new table, even for public access
- RLS Policies should be granular: one policy per operation (`select`, `insert`, `update`, `delete`) and per role (`anon`, `authenticated`)
- **DO NOT combine policies** even if the functionality is the same for both roles
- Include comments explaining the rationale and intended behavior of each security policy

---

## Shadcn/ui Components

### Finding Installed Components

Components are available in `src/components/ui`

### Usage

Import components using the `@/` alias:

```tsx
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
```

### Installing New Components

Use shadcn CLI:

```bash
npx shadcn@latest add [component-name]
```

**Important:** `npx shadcn-ui@latest` is deprecated, use `npx shadcn@latest`

### Styling

This project uses the "new-york" style variant with "neutral" base color and CSS variables for theming (configured in `components.json`).

---

## Supabase + Astro Integration

### Prerequisites

- Astro 5, TypeScript 5, React 19, Tailwind 4
- `@supabase/supabase-js` package installed
- `/supabase/config.toml` exists
- `/src/db/database.types.ts` exists with correct type definitions

### File Structure

1. **Supabase Client** (`/src/db/supabase.client.ts`):

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

2. **Middleware** (`/src/middleware/index.ts`):

```ts
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

3. **Environment Types** (`src/env.d.ts`):

```ts
/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```
