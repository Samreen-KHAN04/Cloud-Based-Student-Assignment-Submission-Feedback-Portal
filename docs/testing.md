# Testing

The first build is verified with TypeScript checks for the API and client and a production Vite build with workflow variables.

Manual acceptance checklist: log in as student, view assignments, submit a valid PDF metadata record, submit a second version, view history and feedback; log in as teacher, create/edit/delete an assignment, open submissions, download the storage reference, grade within the maximum, and confirm an above-maximum mark is rejected.

With both managed workflows running, run the repeatable smoke check:

```powershell
node tests/smoke.mjs
```