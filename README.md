# Cloud-Based Student Assignment Submission & Feedback Portal

An interview-ready student project for submitting assignments, managing deadlines, reviewing versions, and exchanging teacher feedback.

## Implemented

- React + Vite client with student and teacher workspaces
- FastAPI-style REST contract represented in `lib/api-spec/openapi.yaml` and an Express development server
- Local demo authentication with role-based server authorization
- Assignment create, update, delete, list, and detail flows
- Submission metadata validation, late status, resubmission versioning, and private storage-path references
- Teacher review, download reference, marks, and written feedback
- Student and teacher dashboards backed by live in-memory local records
- Loading, empty, error, success, and responsive states

## Local demo

```text
Student:  student@demo.edu / demo-password
Teacher:  teacher@demo.edu / demo-password
```

The local server uses `APP_MODE=local` behavior and keeps records in memory so the project runs without paid cloud services. Restarting the API resets demo data.

## Run

### PowerShell / Windows

Use port `8090` for the API if another local service, such as Oracle, already owns port `8080`.

In PowerShell terminal 1:

```powershell
pnpm install
$env:PORT = "8090"
$env:NODE_ENV = "development"
pnpm.cmd --filter "@workspace/api-server" run dev
```

In PowerShell terminal 2:

```powershell
$env:PORT = "5173"
$env:BASE_PATH = "/"
$env:API_PORT = "8090"
pnpm.cmd --filter "@workspace/assignment-portal" run dev
```

Open `http://localhost:5173`.

If port `8080` is available, use `$env:PORT = "8080"` for the API and `$env:API_PORT = "8080"` for the frontend. The API and `API_PORT` values must match.

### Replit or Unix-like terminals

```bash
pnpm install
PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run dev
# in another terminal
PORT=5173 BASE_PATH=/ API_PORT=8080 pnpm --filter @workspace/assignment-portal run dev
```

Use the Replit preview, or open the local Vite URL printed by the frontend workflow.

## Project map

```text
artifacts/assignment-portal/    React/Vite application
artifacts/api-server/           REST API and local simulation services
lib/api-spec/                   OpenAPI source of truth
lib/api-client-react/           Generated React Query client
lib/api-zod/                    Generated Zod contracts
docs/                           Architecture and cloud extension notes
reports/                        Project and testing notes
```

## Cloud mode

The contract and storage paths are ready for a production adapter. Replace the local session, database, and storage implementations with Firebase Authentication, Firestore, Cloud Storage, and Functions. Do not describe that integration as live until Firebase credentials and rules are configured.

See `docs/deployment.md` and `docs/security.md`.

## Test and build

```powershell
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/assignment-portal run typecheck
pnpm --filter @workspace/assignment-portal run build
```

For the Vite build outside a workflow:

```powershell
$env:PORT=5173; $env:BASE_PATH="/"; pnpm --filter @workspace/assignment-portal run build
```

## Git history plan

```powershell
git init
git add .; git commit -m "Initialize cloud assignment portal"
git add .; git commit -m "Create frontend and backend architecture"
git add .; git commit -m "Implement authentication and role management"
git add .; git commit -m "Add assignment management module"
git add .; git commit -m "Implement submission workflow and versioning"
git add .; git commit -m "Add teacher grading and feedback"
git add .; git commit -m "Build dashboards and authorization"
git add .; git commit -m "Add automated checks and documentation"
```

## Status labels

- **IMPLEMENTED:** local REST flows, RBAC, dashboards, validation, grading, version records
- **LOCAL SIMULATION:** demo sessions and in-memory database/storage references
- **FUTURE EXTENSION:** Firebase Auth, Firestore, Cloud Storage, Functions, malware scanning, managed monitoring, production deployment