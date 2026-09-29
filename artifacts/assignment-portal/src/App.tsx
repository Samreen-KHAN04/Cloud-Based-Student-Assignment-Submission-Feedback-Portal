import { type ElementType, type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown,
  ClipboardCheck, Clock3, Download, File, FileText, GraduationCap, LayoutDashboard,
  LogIn, LogOut, Menu, Pencil, Plus, Search, Settings2,
  ShieldCheck, Sparkles, Trash2, UploadCloud, Users, X,
} from 'lucide-react';
import {
  getGetAssignmentSubmissionsQueryKey, getGetAssignmentsQueryKey,
  getGetCurrentUserQueryKey, getGetMySubmissionsQueryKey, getGetStudentDashboardQueryKey, getGetTeacherDashboardQueryKey,
  useCreateAssignment, useDeleteAssignment, useDownloadSubmission,
  useGetAssignmentSubmissions, useGetAssignments, useGetCurrentUser, useGetMySubmissions,
  useGetStudentDashboard, useGetTeacherDashboard, useGradeSubmission, useLogin, useLogout,
  useRegister, useSubmitAssignment, useUpdateAssignment,
} from '@workspace/api-client-react';
import type { Assignment, AssignmentInput, Submission, User } from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const demoStudent: User = { id: 'demo-student', name: 'Maya Chen', email: 'student@demo.edu', role: 'student' };
const demoTeacher: User = { id: 'demo-teacher', name: 'Dr. Rowan Ellis', email: 'teacher@demo.edu', role: 'teacher' };
const demoAssignments: Assignment[] = [
  { id: 'a1', title: 'Research methods field note', description: 'Document an observation from your chosen field site and connect it to two course readings.', course: 'SOC 204 · Research Methods', deadline: '2025-05-16T23:59:00Z', maxMarks: 40, allowedFileTypes: ['PDF', 'DOCX'], maxFileSize: 10, status: 'open', submissionCount: 18, createdAt: '2025-04-24T10:00:00Z' },
  { id: 'a2', title: 'Interface critique', description: 'Write a concise critique of a digital product through the lens of cognitive load and accessibility.', course: 'DES 118 · Human-centred Design', deadline: '2025-05-21T23:59:00Z', maxMarks: 30, allowedFileTypes: ['PDF'], maxFileSize: 8, status: 'open', submissionCount: 12, createdAt: '2025-04-27T10:00:00Z' },
  { id: 'a3', title: 'Midterm synthesis', description: 'Bring together the semester’s core concepts in a structured argument with references.', course: 'SOC 204 · Research Methods', deadline: '2025-04-30T23:59:00Z', maxMarks: 50, allowedFileTypes: ['PDF', 'DOCX'], maxFileSize: 10, status: 'closed', submissionCount: 26, createdAt: '2025-04-10T10:00:00Z' },
];
const demoSubmissions: Submission[] = [
  { id: 's1', assignmentId: 'a3', assignmentTitle: 'Midterm synthesis', studentName: 'Maya Chen', fileName: 'maya-chen-midterm.pdf', submittedAt: '2025-04-29T18:42:00Z', status: 'GRADED', version: 2, marks: 44, feedback: 'A clear and well-supported synthesis. Your framing of the third concept is especially strong.', gradedAt: '2025-05-02T09:15:00Z' },
  { id: 's2', assignmentId: 'a1', assignmentTitle: 'Research methods field note', studentName: 'Maya Chen', fileName: 'field-note-v1.pdf', submittedAt: '2025-05-12T16:20:00Z', status: 'SUBMITTED', version: 1, marks: null, feedback: null, gradedAt: null },
];

function formatDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
function formatDeadline(value?: string) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
function initials(name = '') { return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'AP'; }

function StatusPill({ status }: { status: string }) {
  const label = status === 'GRADED' ? 'Graded' : status === 'SUBMITTED' ? 'Submitted' : status === 'LATE' ? 'Late' : status === 'closed' ? 'Closed' : 'Open';
  const tone = status === 'GRADED' ? 'status-success' : status === 'LATE' || status === 'closed' ? 'status-warm' : 'status-neutral';
  return <span className={`status-pill ${tone}`} data-testid={`status-${status.toLowerCase()}`}><span className="status-dot" />{label}</span>;
}

function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-3" data-testid="loading-state">{Array.from({ length: lines }).map((_, index) => <div key={index} className="skeleton-line" style={{ width: `${78 - index * 13}%` }} />)}</div>;
}
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="empty-state" data-testid="error-state"><div className="empty-icon"><AlertCircle size={20} /></div><h3>We couldn't load this view</h3><p>Check your connection or try the request again.</p>{onRetry && <Button variant="outline" onClick={onRetry} data-testid="button-retry">Try again</Button>}</div>;
}
function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state" data-testid="empty-state"><div className="empty-icon"><ClipboardCheck size={20} /></div><h3>{title}</h3><p>{body}</p>{action}</div>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUserQuery = useGetCurrentUser({ query: { retry: false, queryKey: getGetCurrentUserQueryKey() } });
  const logout = useLogout();
  const stored = localStorage.getItem('assignment-demo-role');
  const user = currentUserQuery.data ?? (stored === 'teacher' ? demoTeacher : stored === 'student' ? demoStudent : null);
  const role = user?.role ?? (location.startsWith('/teacher') ? 'teacher' : 'student');
  const navItems = role === 'teacher'
    ? [{ href: '/teacher/dashboard', label: 'Overview', icon: LayoutDashboard }, { href: '/teacher/assignments', label: 'Assignments', icon: BookOpen }, { href: '/teacher/submissions', label: 'Review queue', icon: ClipboardCheck }]
    : [{ href: '/student/dashboard', label: 'Overview', icon: LayoutDashboard }, { href: '/student/assignments', label: 'My assignments', icon: BookOpen }, { href: '/student/submissions', label: 'Submission history', icon: UploadCloud }, { href: '/student/feedback', label: 'Feedback', icon: CheckCircle2 }];
  const handleLogout = () => logout.mutate(undefined, { onSettled: () => { localStorage.removeItem('assignment-demo-role'); localStorage.removeItem('assignment-session-token'); queryClient.clear(); setLocation('/login'); } });
  return <div className="app-frame">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup"><div className="brand-mark"><span /></div><div><div className="brand-name">Ledger<span>line</span></div><div className="brand-caption">Academic workspace</div></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-nav"><X size={18} /></button></div>
      <div className="workspace-switcher"><div className="workspace-avatar">NU</div><div className="min-w-0"><div className="workspace-name">Northbridge University</div><div className="workspace-type">{role === 'teacher' ? 'Faculty workspace' : 'Student workspace'}</div></div><ChevronDown size={15} /></div>
      <nav className="sidebar-nav" aria-label="Main navigation">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location === href ? 'nav-link-active' : ''}`} onClick={() => setMobileOpen(false)} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={18} /><span>{label}</span>{label === 'Review queue' && <span className="nav-count">7</span>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><Sparkles size={16} /><div><strong>Keep the loop moving.</strong><span>Every submission has a next step.</span></div></div><button className="nav-link nav-button" onClick={handleLogout} data-testid="button-logout"><LogOut size={18} /><span>Sign out</span></button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-nav-scrim" />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-nav"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{role === 'teacher' ? 'Faculty' : 'Student'}</strong></div><div className="topbar-actions"><div className="health-indicator"><span /> System operational</div><div className="profile-chip"><div className="avatar avatar-small">{initials(user?.name ?? 'Guest')}</div><div className="profile-copy"><strong data-testid="text-user-name">{user?.name ?? 'Guest user'}</strong><span>{role === 'teacher' ? 'Instructor' : 'Student'}</span></div></div></div></header>
      <div className="page-wrap page-enter">{children}</div>
    </main>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}
function MetricCard({ label, value, detail, icon: Icon, tone = 'navy' }: { label: string; value: string | number; detail: string; icon: ElementType; tone?: string }) {
  return <Card className={`metric-card metric-${tone}`} data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="metric-top"><span>{label}</span><Icon size={18} /></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></Card>;
}
function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>;
}
function DeadlineRow({ assignment }: { assignment: Assignment }) {
  const isClosed = assignment.status === 'closed';
  return <Link href="/student/assignments" className="deadline-row" data-testid={`link-deadline-${assignment.id}`}><div className="date-tile"><span>{new Date(assignment.deadline).toLocaleString('en', { month: 'short' })}</span><strong>{new Date(assignment.deadline).getDate()}</strong></div><div className="row-copy"><strong>{assignment.title}</strong><span>{assignment.course}</span></div><div className="row-side"><span className={isClosed ? 'muted-copy' : 'deadline-copy'}>{isClosed ? 'Closed' : formatDeadline(assignment.deadline)}</span><ArrowRight size={16} /></div></Link>;
}

function StudentDashboard() {
  const query = useGetStudentDashboard({ query: { retry: false, queryKey: getGetStudentDashboardQueryKey() } });
  const data = query.data ?? { studentName: demoStudent.name, totalAssignments: 8, pendingAssignments: 2, submittedAssignments: 5, lateAssignments: 1, gradedAssignments: 3, upcomingDeadlines: demoAssignments.slice(0, 2), recentFeedback: demoSubmissions.filter((s) => s.status === 'GRADED') };
  if (query.isLoading) return <><PageHeader eyebrow="Student workspace" title="Good morning, Maya." description="Here's the pulse of your coursework this week." /><LoadingBlock lines={6} /></>;
  return <div data-testid="student-dashboard"><PageHeader eyebrow="Student workspace" title={`Good morning, ${data.studentName.split(' ')[0]}.`} description="Here's the pulse of your coursework this week." action={<Link href="/student/assignments" className="button-primary" data-testid="link-browse-assignments"><Plus size={17} /> Browse assignments</Link>} />
    <div className="metric-grid rise-in"><MetricCard label="Assignments" value={data.totalAssignments} detail="Across your courses" icon={BookOpen} /><MetricCard label="To submit" value={data.pendingAssignments} detail="Keep your momentum" icon={Clock3} tone="gold" /><MetricCard label="Submitted" value={data.submittedAssignments} detail={`${data.lateAssignments} marked late`} icon={UploadCloud} tone="teal" /><MetricCard label="Graded" value={data.gradedAssignments} detail="Feedback is ready" icon={CheckCircle2} tone="rose" /></div>
    <div className="dashboard-grid rise-in delay-1"><Card className="content-card"><SectionTitle title="On the horizon" detail="Your next two deadlines" action={<Link href="/student/assignments" className="text-link" data-testid="link-all-deadlines">View all <ArrowRight size={14} /></Link>} /><div className="deadline-list">{data.upcomingDeadlines.length ? data.upcomingDeadlines.map((assignment) => <DeadlineRow key={assignment.id} assignment={assignment} />) : <EmptyState title="Clear runway" body="You have no upcoming deadlines." />}</div></Card><Card className="content-card feedback-card"><SectionTitle title="Latest feedback" detail="The newest notes from your instructors" /><div className="feedback-list">{data.recentFeedback.length ? data.recentFeedback.map((submission) => <div className="feedback-row" key={submission.id} data-testid={`feedback-${submission.id}`}><div className="feedback-badge"><Check size={15} /></div><div className="row-copy"><strong>{submission.assignmentTitle}</strong><span>{submission.feedback ?? 'Your instructor left feedback on this submission.'}</span></div><div className="mark-display"><strong>{submission.marks ?? '—'}</strong><span>/ 50</span></div></div>) : <EmptyState title="Feedback will appear here" body="Once work is graded, your notes and marks will be collected here." />}</div></Card></div>
    <Card className="quote-card rise-in delay-2"><div className="quote-mark">“</div><div><p>Small, consistent submissions make the big work easier.</p><span>A note from your workspace</span></div><BookOpen size={24} /></Card>
  </div>;
}

function TeacherDashboard() {
  const query = useGetTeacherDashboard({ query: { retry: false, queryKey: getGetTeacherDashboardQueryKey() } });
  const data = query.data ?? { totalAssignments: 6, totalStudents: 84, totalSubmissions: 142, pendingReviews: 7, lateSubmissions: 9, gradedSubmissions: 126, recentUploads: demoSubmissions, upcomingDeadlines: demoAssignments.slice(0, 2) };
  if (query.isLoading) return <><PageHeader eyebrow="Faculty workspace" title="Good morning, Rowan." description="A clear view of what needs your attention." /><LoadingBlock lines={6} /></>;
  return <div data-testid="teacher-dashboard"><PageHeader eyebrow="Faculty workspace" title="Good morning, Rowan." description="A clear view of what needs your attention." action={<Link href="/teacher/assignments/create" className="button-primary" data-testid="link-create-assignment"><Plus size={17} /> New assignment</Link>} />
    <div className="metric-grid rise-in"><MetricCard label="Active assignments" value={data.totalAssignments} detail="This academic term" icon={BookOpen} /><MetricCard label="Students" value={data.totalStudents} detail="Across your courses" icon={Users} tone="gold" /><MetricCard label="Submissions" value={data.totalSubmissions} detail={`${data.gradedSubmissions} graded`} icon={UploadCloud} tone="teal" /><MetricCard label="To review" value={data.pendingReviews} detail={`${data.lateSubmissions} arrived late`} icon={ClipboardCheck} tone="rose" /></div>
    <div className="dashboard-grid rise-in delay-1"><Card className="content-card"><SectionTitle title="Review queue" detail="Recent uploads waiting for your eyes" action={<Link href="/teacher/submissions" className="text-link" data-testid="link-open-review-queue">Open queue <ArrowRight size={14} /></Link>} /><div className="upload-list">{data.recentUploads.length ? data.recentUploads.map((submission) => <Link href="/teacher/submissions" className="upload-row" key={submission.id} data-testid={`link-upload-${submission.id}`}><div className="file-icon"><FileText size={17} /></div><div className="row-copy"><strong>{submission.studentName}</strong><span>{submission.assignmentTitle}</span></div><div className="upload-time">{formatDate(submission.submittedAt)}<ArrowRight size={15} /></div></Link>) : <EmptyState title="Queue is clear" body="Nothing new needs reviewing." />}</div></Card><Card className="content-card"><SectionTitle title="Coming up" detail="Deadlines across your courses" /><div className="deadline-list">{data.upcomingDeadlines.map((assignment) => <DeadlineRow key={assignment.id} assignment={assignment} />)}</div></Card></div>
  </div>;
}

function StudentAssignments() {
  const query = useGetAssignments({ query: { retry: false, queryKey: getGetAssignmentsQueryKey() } });
  const assignments = query.data ?? demoAssignments;
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [search, setSearch] = useState('');
  const visibleAssignments = assignments.filter((assignment) => `${assignment.title} ${assignment.course}`.toLowerCase().includes(search.toLowerCase()));
  return <div data-testid="student-assignments"><PageHeader eyebrow="My coursework" title="Assignments" description="Everything you need to submit, in one calm place." /><div className="toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assignments" aria-label="Search assignments" data-testid="input-search-assignments" /></div><div className="filter-chip"><span>All courses</span><ChevronDown size={15} /></div></div>{query.isError ? <ErrorState onRetry={() => query.refetch()} /> : visibleAssignments.length === 0 ? <EmptyState title="No matching assignments" body="Try a different title or course." /> : <div className="assignment-list">{visibleAssignments.map((assignment, index) => <Card className={`assignment-card rise-in delay-${Math.min(index + 1, 3)}`} key={assignment.id} data-testid={`card-assignment-${assignment.id}`}><div className="assignment-main"><div className="course-label">{assignment.course}</div><h2>{assignment.title}</h2><p>{assignment.description}</p><div className="assignment-meta"><span><CalendarDays size={15} /> Due {formatDeadline(assignment.deadline)}</span><span><File size={15} /> {assignment.allowedFileTypes.join(' · ')} up to {assignment.maxFileSize}MB</span></div></div><div className="assignment-side"><StatusPill status={assignment.status} /><span className="marks-label">{assignment.maxMarks} marks</span><Button onClick={() => setSelected(assignment)} disabled={assignment.status === 'closed'} data-testid={`button-submit-${assignment.id}`}><UploadCloud size={16} /> {assignment.status === 'closed' ? 'Closed' : 'Submit work'}</Button></div></Card>)}</div>}{selected && <SubmissionDialog assignment={selected} onClose={() => setSelected(null)} />}</div>;
}

function SubmissionDialog({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const submit = useSubmitAssignment();
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [success, setSuccess] = useState(false);
  const valid = fileName.trim().length > 2 && Number(fileSize) > 0;
  const handleSubmit = () => { if (!valid) return; submit.mutate({ assignmentId: assignment.id, data: { fileName: fileName.trim(), fileSize: Number(fileSize) } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMySubmissionsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() }); setSuccess(true); } }); };
  return <div className="modal-backdrop"><div className="modal-card" role="dialog" aria-modal="true" data-testid="dialog-submit-assignment"><button className="modal-close" onClick={onClose} aria-label="Close submit dialog" data-testid="button-close-submit"><X size={18} /></button>{success ? <div className="success-panel"><div className="success-icon"><Check size={22} /></div><h2>Submission received</h2><p>Your work has been added to the version history for <strong>{assignment.title}</strong>.</p><Button onClick={onClose} data-testid="button-close-success">Done</Button></div> : <><div className="eyebrow">Submit work</div><h2>{assignment.title}</h2><p className="modal-description">{assignment.description}</p><div className="upload-drop"><UploadCloud size={24} /><strong>Choose a file for this demo submission</strong><span>{assignment.allowedFileTypes.join(', ')} · max {assignment.maxFileSize}MB</span><Input placeholder="File name, e.g. research-note.pdf" value={fileName} onChange={(event) => setFileName(event.target.value)} data-testid="input-file-name" /><Input type="number" min="1" placeholder="File size in MB" value={fileSize} onChange={(event) => setFileSize(event.target.value)} data-testid="input-file-size" /></div>{fileName && Number(fileSize) > assignment.maxFileSize && <div className="validation-error" data-testid="error-file-size">This file exceeds the {assignment.maxFileSize}MB limit.</div>}<Button className="w-full" disabled={!valid || Number(fileSize) > assignment.maxFileSize || submit.isPending} onClick={handleSubmit} data-testid="button-confirm-submit">{submit.isPending ? 'Submitting…' : 'Submit version'}</Button>{submit.isError && <div className="validation-error">Submission could not be sent. Please try again.</div>}</>}</div></div>;
}

function StudentSubmissions({ feedbackOnly = false }: { feedbackOnly?: boolean }) {
  const query = useGetMySubmissions({ query: { retry: false, queryKey: getGetMySubmissionsQueryKey() } });
  const submissions = query.data ?? demoSubmissions;
  const shown = feedbackOnly ? submissions.filter((submission) => submission.status === 'GRADED') : submissions;
  return <div data-testid={feedbackOnly ? 'student-feedback' : 'student-submissions'}><PageHeader eyebrow="Your work" title={feedbackOnly ? 'Feedback' : 'Submission history'} description={feedbackOnly ? 'Marks and notes from the people reading your work.' : 'A complete record of every version you have sent.'} />{query.isError ? <ErrorState onRetry={() => query.refetch()} /> : shown.length === 0 ? <EmptyState title={feedbackOnly ? 'No feedback yet' : 'No submissions yet'} body={feedbackOnly ? 'Graded work and instructor notes will show up here.' : 'Once you submit an assignment, each version will be listed here.'} action={<Link href="/student/assignments" className="button-primary" data-testid="link-empty-assignments">Browse assignments <ArrowRight size={16} /></Link>} /> : <div className="history-list">{shown.map((submission) => <Card className="history-card" key={submission.id} data-testid={`card-submission-${submission.id}`}><div className="history-icon"><FileText size={18} /></div><div className="row-copy"><div className="history-title"><strong>{submission.assignmentTitle}</strong><StatusPill status={submission.status} /></div><span>{submission.fileName} · Version {submission.version}</span><small>Submitted {formatDate(submission.submittedAt)}{submission.gradedAt ? ` · Graded ${formatDate(submission.gradedAt)}` : ''}</small></div><div className="history-result">{submission.marks != null ? <><strong>{submission.marks}</strong><span>marks</span></> : <span className="muted-copy">Awaiting review</span>}</div>{submission.feedback && <div className="feedback-note"><span>Instructor note</span><p>{submission.feedback}</p></div>}</Card>)}</div>}</div>;
}

function AssignmentForm({ existing, onDone }: { existing?: Assignment; onDone?: () => void }) {
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const [form, setForm] = useState<AssignmentInput>({ title: existing?.title ?? '', description: existing?.description ?? '', course: existing?.course ?? '', deadline: existing?.deadline?.slice(0, 16) ?? '', maxMarks: existing?.maxMarks ?? 40, allowedFileTypes: existing?.allowedFileTypes ?? ['PDF'], maxFileSize: existing?.maxFileSize ?? 10 });
  const [types, setTypes] = useState((existing?.allowedFileTypes ?? ['PDF']).join(', '));
  const [saved, setSaved] = useState(false);
  const updateField = (key: keyof AssignmentInput, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const valid = form.title.length >= 3 && form.description.length > 0 && form.course.length > 0 && !!form.deadline && form.maxMarks > 0 && form.maxFileSize > 0;
  const submit = () => { if (!valid) return; const data = { ...form, allowedFileTypes: types.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean) }; const options = { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetAssignmentsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetTeacherDashboardQueryKey() }); setSaved(true); onDone?.(); } }; existing ? update.mutate({ assignmentId: existing.id, data }, options) : create.mutate({ data }, options); };
  return <Card className="form-card" data-testid={existing ? `form-edit-assignment-${existing.id}` : 'form-create-assignment'}>{saved && <div className="inline-success" data-testid="success-assignment-saved"><CheckCircle2 size={16} /> Assignment saved successfully.</div>}<div className="form-section"><div className="eyebrow">Assignment details</div><h2>{existing ? 'Edit assignment' : 'Set the brief clearly'}</h2><p>Students do better work when the constraints are easy to find.</p></div><div className="form-grid"><label>Assignment title<Input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="e.g. Research methods field note" data-testid="input-assignment-title" /></label><label>Course / module<Input value={form.course} onChange={(event) => updateField('course', event.target.value)} placeholder="e.g. SOC 204 · Research Methods" data-testid="input-assignment-course" /></label><label className="span-2">Brief description<Textarea rows={4} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="What should students make, investigate, or explain?" data-testid="input-assignment-description" /></label><label>Deadline<Input type="datetime-local" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} data-testid="input-assignment-deadline" /></label><label>Maximum marks<Input type="number" min="1" value={form.maxMarks} onChange={(event) => updateField('maxMarks', Number(event.target.value))} data-testid="input-assignment-marks" /></label><label>Allowed file types<Input value={types} onChange={(event) => setTypes(event.target.value)} placeholder="PDF, DOCX" data-testid="input-assignment-file-types" /><span className="field-hint">Separate formats with commas.</span></label><label>Maximum file size (MB)<Input type="number" min="1" value={form.maxFileSize} onChange={(event) => updateField('maxFileSize', Number(event.target.value))} data-testid="input-assignment-file-size" /></label></div><div className="form-footer"><span className="form-hint">{!valid ? 'Complete all required fields to continue.' : 'All set. You can revise this later.'}</span><Button disabled={!valid || create.isPending || update.isPending} onClick={submit} data-testid="button-save-assignment">{create.isPending || update.isPending ? 'Saving…' : existing ? 'Save changes' : 'Create assignment'}</Button></div></Card>;
}

function TeacherAssignments() {
  const query = useGetAssignments({ query: { retry: false, queryKey: getGetAssignmentsQueryKey() } });
  const remove = useDeleteAssignment();
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [search, setSearch] = useState('');
  const assignments = query.data ?? demoAssignments;
  const visibleAssignments = assignments.filter((assignment) => `${assignment.title} ${assignment.course}`.toLowerCase().includes(search.toLowerCase()));
  const handleDelete = (assignment: Assignment) => { if (window.confirm(`Delete “${assignment.title}”?`)) remove.mutate({ assignmentId: assignment.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAssignmentsQueryKey() }) }); };
  return <div data-testid="teacher-assignments"><PageHeader eyebrow="Faculty workspace" title="Assignments" description="Shape the brief, set the guardrails, keep the handoff clear." action={<Link href="/teacher/assignments/create" className="button-primary" data-testid="link-add-assignment"><Plus size={17} /> New assignment</Link>} />{query.isError ? <ErrorState onRetry={() => query.refetch()} /> : <Card className="table-card"><div className="table-toolbar"><div><strong>{visibleAssignments.length} assignments</strong><span>Published to your students</span></div><div className="search-field compact"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" aria-label="Search assignments" data-testid="input-search-teacher-assignments" /></div></div><div className="assignment-table"><div className="table-head"><span>Assignment</span><span>Deadline</span><span>Submissions</span><span>Status</span><span /></div>{visibleAssignments.map((assignment) => <div className="table-row" key={assignment.id} data-testid={`row-assignment-${assignment.id}`}><div className="table-title"><div className="file-icon soft"><BookOpen size={16} /></div><div><strong>{assignment.title}</strong><span>{assignment.course}</span></div></div><span>{formatDate(assignment.deadline)}</span><span>{assignment.submissionCount} received</span><StatusPill status={assignment.status} /><div className="row-actions"><button onClick={() => setEditing(assignment)} aria-label={`Edit ${assignment.title}`} data-testid={`button-edit-${assignment.id}`}><Pencil size={16} /></button><button onClick={() => handleDelete(assignment)} aria-label={`Delete ${assignment.title}`} data-testid={`button-delete-${assignment.id}`}><Trash2 size={16} /></button></div></div>)}</div></Card>}{editing && <div className="modal-backdrop"><div className="modal-card modal-wide"><button className="modal-close" onClick={() => setEditing(null)} aria-label="Close edit form" data-testid="button-close-edit"><X size={18} /></button><AssignmentForm existing={editing} onDone={() => setEditing(null)} /></div></div>}</div>;
}

function TeacherSubmissions() {
  const assignmentsQuery = useGetAssignments({ query: { retry: false, queryKey: getGetAssignmentsQueryKey() } });
  const assignments = assignmentsQuery.data ?? demoAssignments;
  const [selectedId, setSelectedId] = useState(assignments[0]?.id ?? '');
  const selected = assignments.find((assignment) => assignment.id === selectedId) ?? assignments[0];
  const query = useGetAssignmentSubmissions(selected?.id ?? '', { query: { enabled: !!selected?.id, queryKey: getGetAssignmentSubmissionsQueryKey(selected?.id ?? ''), retry: false } });
  const submissions = query.data ?? demoSubmissions;
  const grade = useGradeSubmission();
  const [active, setActive] = useState<Submission | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const openGrade = (submission: Submission) => { setActive(submission); setMarks(String(submission.marks ?? '')); setFeedback(submission.feedback ?? ''); };
  const saveGrade = () => { if (!active || !marks) return; grade.mutate({ submissionId: active.id, data: { marks: Number(marks), feedback } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetAssignmentSubmissionsQueryKey(selected?.id ?? '') }); queryClient.invalidateQueries({ queryKey: getGetTeacherDashboardQueryKey() }); setActive(null); } }); };
  const download = useDownloadSubmission(active?.id ?? '', { query: { enabled: false, queryKey: ['download', active?.id ?? ''] } });
  const downloadFile = () => { if (!active) return; download.refetch().then((result) => { if (result.data?.storagePath) window.open(result.data.storagePath, '_blank'); }); };
  return <div data-testid="teacher-submissions"><PageHeader eyebrow="Faculty workspace" title="Review queue" description="Read closely, respond thoughtfully, and close the loop." /><div className="review-toolbar"><div><label htmlFor="assignment-select">Reviewing</label><select id="assignment-select" value={selected?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)} data-testid="select-review-assignment">{assignments.map((assignment) => <option value={assignment.id} key={assignment.id}>{assignment.title}</option>)}</select></div><div className="queue-summary"><span><span className="queue-dot" /> {submissions.filter((item) => item.status !== 'GRADED').length} waiting</span><span>{submissions.length} total</span></div></div>{query.isError ? <ErrorState onRetry={() => query.refetch()} /> : submissions.length === 0 ? <EmptyState title="Review queue is clear" body="No students have submitted this assignment yet." /> : <Card className="table-card"><div className="assignment-table"><div className="table-head"><span>Student</span><span>File</span><span>Submitted</span><span>Status</span><span /></div>{submissions.map((submission) => <div className="table-row" key={submission.id} data-testid={`row-submission-${submission.id}`}><div className="table-title"><div className="avatar avatar-small">{initials(submission.studentName)}</div><div><strong>{submission.studentName}</strong><span>Version {submission.version}</span></div></div><span className="file-name"><FileText size={15} />{submission.fileName}</span><span>{formatDate(submission.submittedAt)}</span><StatusPill status={submission.status} /><Button size="sm" variant={submission.status === 'GRADED' ? 'outline' : 'default'} onClick={() => openGrade(submission)} data-testid={`button-grade-${submission.id}`}>{submission.status === 'GRADED' ? 'View grade' : 'Review'}</Button></div>)}</div></Card>}{active && <div className="modal-backdrop"><div className="modal-card" role="dialog" aria-modal="true" data-testid="dialog-grade-submission"><button className="modal-close" onClick={() => setActive(null)} aria-label="Close grading dialog" data-testid="button-close-grade"><X size={18} /></button><div className="eyebrow">Review submission</div><h2>{active.studentName}</h2><p className="modal-description">{active.assignmentTitle} · {active.fileName}</p><button className="download-button" onClick={downloadFile} data-testid="button-download-submission"><Download size={16} /> Download submission</button><label>Mark out of {selected?.maxMarks ?? 50}<Input type="number" min="0" max={selected?.maxMarks ?? 50} value={marks} onChange={(event) => setMarks(event.target.value)} data-testid="input-grade-marks" /></label><label>Feedback for the student<Textarea rows={5} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="What should the student keep, clarify, or try next?" data-testid="input-grade-feedback" /></label><Button className="w-full" disabled={!marks || grade.isPending} onClick={saveGrade} data-testid="button-save-grade">{grade.isPending ? 'Saving grade…' : 'Save grade and feedback'}</Button>{grade.isError && <div className="validation-error">This grade could not be saved.</div>}</div></div>}</div>;
}

function AuthLayout({ children, mode }: { children: ReactNode; mode: 'login' | 'register' }) {
  return <div className="auth-layout"><div className="auth-visual"><div className="auth-brand"><div className="brand-mark"><span /></div><div><div className="brand-name">Ledger<span>line</span></div><div className="brand-caption">Academic workspace</div></div></div><div className="auth-message"><div className="eyebrow">Northbridge University</div><h1>Work submitted.<br /><em>Progress visible.</em></h1><p>A focused place for assignments, versions, and the feedback that moves learning forward.</p></div><div className="auth-footer"><span>Secure by default</span><span>Built for thoughtful work</span></div></div><div className="auth-panel"><div className="auth-panel-top"><span>{mode === 'login' ? 'New here?' : 'Already have an account?'}</span><Link href={mode === 'login' ? '/register' : '/login'} className="text-link" data-testid={`link-${mode === 'login' ? 'register' : 'login'}`}>{mode === 'login' ? 'Create an account' : 'Sign in'} <ArrowRight size={14} /></Link></div>{children}</div></div>;
}

function LoginPage() {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const demo = (role: 'student' | 'teacher') => { localStorage.setItem('assignment-demo-role', role); setEmail(role === 'student' ? 'student@demo.edu' : 'teacher@demo.edu'); setPassword('demo-password'); setError(''); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!email || !password) { setError('Enter your email and password to continue.'); return; } login.mutate({ data: { email, password } }, { onSuccess: (session) => { localStorage.setItem('assignment-demo-role', session.user.role); localStorage.setItem('assignment-session-token', session.token); queryClient.clear(); setLocation(session.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'); }, onError: () => setError('Those details did not work. Try one of the demo profiles below.') }); };
  return <AuthLayout mode="login"><div className="auth-form-wrap"><div className="auth-kicker"><ShieldCheck size={17} /> Secure sign in</div><h2>Welcome back.</h2><p className="auth-description">Pick up where you left off.</p><form onSubmit={submit} className="auth-form"><label>Email address<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@university.edu" data-testid="input-login-email" /></label><label>Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" data-testid="input-login-password" /></label>{error && <div className="validation-error" data-testid="error-login">{error}</div>}<Button className="w-full" type="submit" disabled={login.isPending} data-testid="button-login"><LogIn size={16} />{login.isPending ? 'Signing in…' : 'Sign in'}</Button></form><div className="demo-divider"><span>Or explore the demo</span></div><div className="demo-buttons"><button onClick={() => demo('student')} data-testid="button-demo-student"><div className="demo-avatar gold">MC</div><span><strong>Student view</strong><small>student@demo.edu</small></span><ArrowRight size={15} /></button><button onClick={() => demo('teacher')} data-testid="button-demo-teacher"><div className="demo-avatar teal">RE</div><span><strong>Instructor view</strong><small>teacher@demo.edu</small></span><ArrowRight size={15} /></button></div><p className="auth-note">Demo credentials are filled into the form. The API still handles the sign-in.</p></div></AuthLayout>;
}

function RegisterPage() {
  const [, setLocation] = useLocation();
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' as 'student' | 'teacher' });
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (form.name.length < 2 || !form.email || form.password.length < 6) { setError('Add your name, a valid email, and a password of at least 6 characters.'); return; } register.mutate({ data: form }, { onSuccess: (session) => { localStorage.setItem('assignment-demo-role', session.user.role); localStorage.setItem('assignment-session-token', session.token); queryClient.clear(); setLocation(session.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'); }, onError: () => setError('We could not create this account. Please check your details.') }); };
  return <AuthLayout mode="register"><div className="auth-form-wrap"><div className="auth-kicker"><Settings2 size={17} /> Get started</div><h2>Create your workspace.</h2><p className="auth-description">One account for every brief, version, and note.</p><form onSubmit={submit} className="auth-form"><label>Full name<Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" data-testid="input-register-name" /></label><label>University email<Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@university.edu" data-testid="input-register-email" /></label><label>Password<Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 6 characters" data-testid="input-register-password" /></label><label>Workspace role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as 'student' | 'teacher' })} data-testid="select-register-role"><option value="student">Student</option><option value="teacher">Instructor</option></select></label>{error && <div className="validation-error" data-testid="error-register">{error}</div>}<Button className="w-full" type="submit" disabled={register.isPending} data-testid="button-register">{register.isPending ? 'Creating account…' : 'Create account'}<ArrowRight size={16} /></Button></form><p className="auth-note">By continuing, you agree to use Ledgerline for academic work only.</p></div></AuthLayout>;
}

function FeedbackPage() {
  return <StudentSubmissions feedbackOnly />;
}
function SubmissionsPage() {
  return <StudentSubmissions />;
}

function CreateAssignmentPage() {
  return <div data-testid="create-assignment-page"><PageHeader eyebrow="Faculty workspace / New" title="Create an assignment" description="Give students a clear brief and a fair runway." action={<Link href="/teacher/assignments" className="button-subtle" data-testid="link-cancel-assignment"><X size={16} /> Cancel</Link>} /><AssignmentForm /></div>;
}

function ProtectedRouter() {
  return <AppShell><Switch><Route path="/student/dashboard" component={StudentDashboard} /><Route path="/student/assignments" component={StudentAssignments} /><Route path="/student/submissions" component={SubmissionsPage} /><Route path="/student/feedback" component={FeedbackPage} /><Route path="/teacher/dashboard" component={TeacherDashboard} /><Route path="/teacher/assignments" component={TeacherAssignments} /><Route path="/teacher/assignments/create" component={CreateAssignmentPage} /><Route path="/teacher/submissions" component={TeacherSubmissions} /><Route component={NotFound} /></Switch></AppShell>;
}

function Router() {
  const [location] = useLocation();
  const isAuth = location === '/login' || location === '/register' || location === '/';
  return <ErrorBoundary resetKey={location}>{isAuth ? <Switch><Route path="/login" component={LoginPage} /><Route path="/register" component={RegisterPage} /><Route path="/" component={LoginPage} /></Switch> : <ProtectedRouter />}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;