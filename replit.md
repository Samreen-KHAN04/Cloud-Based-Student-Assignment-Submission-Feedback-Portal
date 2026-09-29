# Cloud-Based Student Assignment Submission & Feedback Portal

Student and teacher workspaces for assignment submission, version history, grading, and feedback.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Local demo credentials are documented in `README.md`; production cloud credentials belong in secrets, not source.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- Student dashboard, assignments, submissions, and feedback
- Teacher dashboard, assignment CRUD, review queue, grading, and download references
- Local role-based demo mode with server-side authorization

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The frontend build needs `PORT` and `BASE_PATH`; managed workflows provide both.
- Local demo records are in memory and reset when the API restarts.
- Firebase is documented as a production extension, not configured by default.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
