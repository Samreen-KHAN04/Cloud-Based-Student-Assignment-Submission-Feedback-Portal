# REST API

All routes are mounted under `/api`. Protected routes require `Authorization: Bearer <session-token>`.

Authentication: `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /me`.

Assignments: `GET /assignments`, `POST /assignments`, `GET|PUT|DELETE /assignments/:assignmentId`.

Submissions: `POST /assignments/:assignmentId/submit`, `GET /submissions/me`, `GET /assignments/:assignmentId/submissions`, `POST /submissions/:submissionId/grade`, and `GET /submissions/:submissionId/download`.

The OpenAPI source of truth is `lib/api-spec/openapi.yaml`.