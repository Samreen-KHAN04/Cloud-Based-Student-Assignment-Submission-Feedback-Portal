import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

type Role = "student" | "teacher";
type User = { id: string; name: string; email: string; role: Role; password: string };
type Assignment = {
  id: string; title: string; description: string; course: string; deadline: string;
  maxMarks: number; allowedFileTypes: string[]; maxFileSize: number; status: "open" | "closed";
  submissionCount: number; createdAt: string;
};
type Submission = {
  id: string; assignmentId: string; assignmentTitle: string; studentName: string; studentId: string;
  fileName: string; submittedAt: string; status: "SUBMITTED" | "LATE" | "GRADED";
  version: number; marks: number | null; feedback: string | null; gradedAt: string | null;
  storagePath: string;
};

const router = Router();
const now = new Date();
const users: User[] = [
  { id: "teacher-1", name: "Dr. Maya Patel", email: "teacher@demo.edu", password: "demo-password", role: "teacher" },
  { id: "student-1", name: "Aarav Sharma", email: "student@demo.edu", password: "demo-password", role: "student" },
  { id: "student-2", name: "Nisha Rao", email: "nisha@example.com", password: "Demo123!", role: "student" },
];
const assignments: Assignment[] = [
  {
    id: "assignment-1",
    title: "Cloud Architecture Assignment",
    description: "Design a resilient cloud architecture for a small university portal. Explain your choices around storage, scaling, and failure handling.",
    course: "Cloud Computing",
    deadline: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    maxMarks: 100,
    allowedFileTypes: ["pdf", "docx"],
    maxFileSize: 10,
    status: "open",
    submissionCount: 2,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: "assignment-2",
    title: "REST API Security Review",
    description: "Review a REST API design and identify authentication, authorization, validation, and observability controls.",
    course: "Cloud Computing",
    deadline: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    maxMarks: 50,
    allowedFileTypes: ["pdf", "docx", "zip"],
    maxFileSize: 20,
    status: "open",
    submissionCount: 0,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "assignment-3",
    title: "Serverless Functions Lab",
    description: "Implement and document a small event-driven function with a retry-safe handler.",
    course: "Cloud Computing",
    deadline: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    maxMarks: 75,
    allowedFileTypes: ["pdf", "zip"],
    maxFileSize: 15,
    status: "closed",
    submissionCount: 1,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
];
const submissions: Submission[] = [
  {
    id: "submission-1", assignmentId: "assignment-1", assignmentTitle: assignments[0].title, studentName: users[1].name,
    studentId: users[1].id, fileName: "aarav-cloud-architecture.pdf", submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 16).toISOString(),
    status: "GRADED", version: 1, marks: 86, feedback: "Strong architecture and a clear explanation of failure handling. Add more detail on cost controls in the next iteration.",
    gradedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(), storagePath: "assignments/assignment-1/student-1/submission-v1.pdf",
  },
  {
    id: "submission-2", assignmentId: "assignment-3", assignmentTitle: assignments[2].title, studentName: users[1].name,
    studentId: users[1].id, fileName: "serverless-lab.zip", submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
    status: "LATE", version: 1, marks: null, feedback: null, gradedAt: null, storagePath: "assignments/assignment-3/student-1/submission-v1.zip",
  },
  {
    id: "submission-3", assignmentId: "assignment-1", assignmentTitle: assignments[0].title, studentName: users[2].name,
    studentId: users[2].id, fileName: "nisha-architecture.docx", submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(),
    status: "SUBMITTED", version: 1, marks: null, feedback: null, gradedAt: null, storagePath: "assignments/assignment-1/student-2/submission-v1.docx",
  },
];
const sessions = new Map<string, string>();

function currentUser(req: Request) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? sessions.get(token) : undefined;
  return users.find((user) => user.id === userId);
}
function requireUser(req: Request, res: Response, roles?: Role[]) {
  const user = currentUser(req);
  if (!user) { res.status(401).json({ error: "Your session has expired. Please log in again." }); return undefined; }
  if (roles && !roles.includes(user.role)) { res.status(403).json({ error: "You do not have permission to access this resource." }); return undefined; }
  return user;
}
function publicAssignment(assignment: Assignment) {
  return { ...assignment, submissionCount: submissions.filter((s) => s.assignmentId === assignment.id).length };
}
function publicSubmission(submission: Submission) {
  const { studentId: _studentId, storagePath: _storagePath, ...safe } = submission;
  return safe;
}

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = users.find((item) => item.email.toLowerCase() === String(email).toLowerCase() && item.password === password);
  if (!user) return res.status(401).json({ error: "Invalid email or password." });
  const token = randomUUID();
  sessions.set(token, user.id);
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});
router.post("/auth/register", (req, res) => {
  const { name, email, password, role = "student" } = req.body ?? {};
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: "Name, email, and a password of at least 6 characters are required." });
  if (users.some((user) => user.email.toLowerCase() === String(email).toLowerCase())) return res.status(409).json({ error: "An account with that email already exists." });
  const user: User = { id: randomUUID(), name, email, password, role: role === "teacher" ? "teacher" : "student" };
  users.push(user);
  const token = randomUUID();
  sessions.set(token, user.id);
  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});
router.post("/auth/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) sessions.delete(token);
  return res.status(204).send();
});
router.get("/me", (req, res) => {
  const user = requireUser(req, res);
  return user ? res.json({ id: user.id, name: user.name, email: user.email, role: user.role }) : undefined;
});
router.get("/assignments", (req, res) => {
  const user = requireUser(req, res);
  return user ? res.json(assignments.map(publicAssignment)) : undefined;
});
router.post("/assignments", (req, res) => {
  const user = requireUser(req, res, ["teacher"]);
  if (!user) return;
  const body = req.body ?? {};
  if (!body.title || !body.description || !body.course || !body.deadline || !body.maxMarks) return res.status(400).json({ error: "Title, description, course, deadline, and maximum marks are required." });
  const assignment: Assignment = { id: randomUUID(), title: body.title, description: body.description, course: body.course, deadline: new Date(body.deadline).toISOString(), maxMarks: Number(body.maxMarks), allowedFileTypes: body.allowedFileTypes ?? ["pdf"], maxFileSize: Number(body.maxFileSize ?? 10 * 1024 * 1024), status: new Date(body.deadline) < new Date() ? "closed" : "open", submissionCount: 0, createdAt: new Date().toISOString() };
  assignments.unshift(assignment);
  return res.status(201).json(publicAssignment(assignment));
});
router.get("/assignments/:assignmentId", (req, res) => {
  const user = requireUser(req, res);
  const assignment = assignments.find((item) => item.id === req.params.assignmentId);
  if (!user || !assignment) return user ? res.status(404).json({ error: "Assignment not found." }) : undefined;
  return res.json(publicAssignment(assignment));
});
router.put("/assignments/:assignmentId", (req, res) => {
  const user = requireUser(req, res, ["teacher"]);
  const assignment = assignments.find((item) => item.id === req.params.assignmentId);
  if (!user || !assignment) return user ? res.status(404).json({ error: "Assignment not found." }) : undefined;
  Object.assign(assignment, req.body, { deadline: new Date(req.body.deadline ?? assignment.deadline).toISOString(), maxMarks: Number(req.body.maxMarks ?? assignment.maxMarks) });
  return res.json(publicAssignment(assignment));
});
router.delete("/assignments/:assignmentId", (req, res) => {
  const user = requireUser(req, res, ["teacher"]);
  const index = assignments.findIndex((item) => item.id === req.params.assignmentId);
  if (!user || index < 0) return user ? res.status(404).json({ error: "Assignment not found." }) : undefined;
  assignments.splice(index, 1);
  return res.status(204).send();
});
router.post("/assignments/:assignmentId/submit", (req, res) => {
  const user = requireUser(req, res, ["student"]);
  const assignment = assignments.find((item) => item.id === req.params.assignmentId);
  if (!user || !assignment) return user ? res.status(404).json({ error: "Assignment not found." }) : undefined;
  const { fileName, fileSize } = req.body ?? {};
  const extension = String(fileName ?? "").split(".").pop()?.toLowerCase();
  if (!fileName || !fileSize || !extension || !assignment.allowedFileTypes.map((type) => type.toLowerCase()).includes(extension)) return res.status(400).json({ error: `File type not allowed. Accepted types: ${assignment.allowedFileTypes.join(", ")}.` });
  if (Number(fileSize) > assignment.maxFileSize) return res.status(413).json({ error: `File is too large. Maximum size is ${assignment.maxFileSize} MB.` });
  const previous = submissions.filter((item) => item.assignmentId === assignment.id && item.studentId === user.id);
  const submittedAt = new Date();
  const late = submittedAt > new Date(assignment.deadline);
  const submission: Submission = { id: randomUUID(), assignmentId: assignment.id, assignmentTitle: assignment.title, studentName: user.name, studentId: user.id, fileName, submittedAt: submittedAt.toISOString(), status: late ? "LATE" : "SUBMITTED", version: previous.length + 1, marks: null, feedback: null, gradedAt: null, storagePath: `assignments/${assignment.id}/${user.id}/submission-v${previous.length + 1}.${extension}` };
  submissions.push(submission);
  return res.status(201).json(publicSubmission(submission));
});
router.get("/submissions/me", (req, res) => {
  const user = requireUser(req, res, ["student"]);
  return user ? res.json(submissions.filter((item) => item.studentId === user.id).map(publicSubmission)) : undefined;
});
router.get("/assignments/:assignmentId/submissions", (req, res) => {
  const user = requireUser(req, res, ["teacher"]);
  return user ? res.json(submissions.filter((item) => item.assignmentId === req.params.assignmentId).map(publicSubmission)) : undefined;
});
router.post("/submissions/:submissionId/grade", (req, res) => {
  const user = requireUser(req, res, ["teacher"]);
  const submission = submissions.find((item) => item.id === req.params.submissionId);
  const assignment = submission && assignments.find((item) => item.id === submission.assignmentId);
  if (!user || !submission || !assignment) return user ? res.status(404).json({ error: "Submission not found." }) : undefined;
  const marks = Number(req.body?.marks);
  if (!Number.isFinite(marks) || marks < 0 || marks > assignment.maxMarks) return res.status(400).json({ error: `Marks must be between 0 and ${assignment.maxMarks}.` });
  submission.marks = marks; submission.feedback = String(req.body?.feedback ?? ""); submission.gradedAt = new Date().toISOString(); submission.status = "GRADED";
  return res.json(publicSubmission(submission));
});
router.get("/submissions/:submissionId/download", async (req, res) => {
  const user = requireUser(req, res);
  const submission = submissions.find((item) => item.id === req.params.submissionId);
  if (!user || !submission || (user.role === "student" && submission.studentId !== user.id)) return user ? res.status(404).json({ error: "Submission not found." }) : undefined;
  return res.json({ fileName: submission.fileName, storagePath: submission.storagePath });
});
router.get("/dashboard/student", (req, res) => {
  const user = requireUser(req, res, ["student"]);
  if (!user) return;
  const mine = submissions.filter((item) => item.studentId === user.id);
  const latest = assignments.filter((assignment) => !mine.some((item) => item.assignmentId === assignment.id));
  return res.json({ studentName: user.name, totalAssignments: assignments.length, pendingAssignments: latest.length, submittedAssignments: new Set(mine.map((item) => item.assignmentId)).size, lateAssignments: mine.filter((item) => item.status === "LATE").length, gradedAssignments: mine.filter((item) => item.status === "GRADED").length, upcomingDeadlines: assignments.filter((item) => new Date(item.deadline) > new Date()).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3).map(publicAssignment), recentFeedback: mine.filter((item) => item.feedback).slice(-3).reverse().map(publicSubmission) });
});
router.get("/dashboard/teacher", (req, res) => {
  const user = requireUser(req, res, ["teacher"]);
  if (!user) return;
  return res.json({ totalAssignments: assignments.length, totalStudents: users.filter((item) => item.role === "student").length, totalSubmissions: submissions.length, pendingReviews: submissions.filter((item) => item.status !== "GRADED").length, lateSubmissions: submissions.filter((item) => item.status === "LATE").length, gradedSubmissions: submissions.filter((item) => item.status === "GRADED").length, recentUploads: submissions.slice(-5).reverse().map(publicSubmission), upcomingDeadlines: assignments.filter((item) => new Date(item.deadline) > new Date()).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3).map(publicAssignment) });
});

export default router;