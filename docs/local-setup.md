# Local setup in VS Code

Open the extracted project folder in VS Code. Install Node.js 20 or newer and pnpm first.

In PowerShell terminal 1, start the API:

```powershell
pnpm install
$env:PORT=8080
pnpm --filter @workspace/api-server run dev
```

In PowerShell terminal 2, start the React app:

```powershell
$env:PORT=5173
$env:BASE_PATH="/"
pnpm --filter @workspace/assignment-portal run dev
```

Open `http://localhost:5173`.

Use `student@demo.edu / demo-password` for the student view and `teacher@demo.edu / demo-password` for the teacher view.

The Vite development proxy forwards `/api` requests to the API server on port 8080.