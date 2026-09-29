const baseUrl = process.env.API_URL ?? "http://localhost:80/api";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

const session = await request("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "student@demo.edu", password: "demo-password" }),
});
const auth = { authorization: `Bearer ${session.token}` };
const dashboard = await request("/dashboard/student", { headers: auth });
if (dashboard.totalAssignments < 1) throw new Error("Expected seeded assignments");

const assignments = await request("/assignments", { headers: auth });
const assignment = assignments.find((item) => item.status === "open");
if (!assignment) throw new Error("Expected an open assignment");

const submission = await request(`/assignments/${assignment.id}/submit`, {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ fileName: "smoke-test.pdf", fileSize: 1 }),
});
if (submission.version < 1) throw new Error("Expected a versioned submission");

const forbidden = await fetch(`${baseUrl}/dashboard/teacher`, { headers: auth });
if (forbidden.status !== 403) throw new Error(`Expected student access to teacher dashboard to be rejected, got ${forbidden.status}`);

await request("/auth/logout", { method: "POST", headers: auth });
console.log("Portal smoke test passed: login, dashboard, submission, RBAC, logout");