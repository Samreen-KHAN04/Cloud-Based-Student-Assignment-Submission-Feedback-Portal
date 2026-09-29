# Architecture

## Implemented local architecture

Browser React app → `/api` REST server → local in-memory records and private storage references.

The browser never decides a user's role. Every protected endpoint reads the bearer session on the server and checks the role before returning data or mutating records.

## Production extension

Users → CDN/Firebase Hosting → API Gateway or Cloud Run FastAPI service → Firestore metadata + Firebase Cloud Storage bytes → Cloud Functions for late processing, analytics, and asynchronous scanning → Cloud Logging/Monitoring.

The production diagram is an extension, not a claim that these services are configured in this local project.