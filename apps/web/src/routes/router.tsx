import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { LayoutShell } from "@/shared/components/layout-shell";
import { ProtectedLayout } from "./protected-layout";
import { PermissionRoute } from "./permission-route";
import { ForbiddenPage } from "./forbidden-page";

const LoginPage = lazy(() =>
  import("./login-page").then((m) => ({ default: m.LoginPage }))
);
const AdminLayout = lazy(() =>
  import("@/features/admin").then((m) => ({ default: m.AdminLayout }))
);
const DashboardPage = lazy(() =>
  import("./dashboard-page").then((m) => ({ default: m.DashboardPage }))
);
const UsersPage = lazy(() =>
  import("./users-page").then((m) => ({ default: m.UsersPage }))
);
const RolesPage = lazy(() =>
  import("./roles-page").then((m) => ({ default: m.RolesPage }))
);
const StudentsPage = lazy(() =>
  import("./students-page").then((m) => ({ default: m.StudentsPage }))
);
const TeachersPage = lazy(() =>
  import("./teachers-page").then((m) => ({ default: m.TeachersPage }))
);
const ClassesPage = lazy(() =>
  import("./classes-page").then((m) => ({ default: m.ClassesPage }))
);
const ProgramsPage = lazy(() =>
  import("./programs-page").then((m) => ({ default: m.ProgramsPage }))
);
const AcademicYearsPage = lazy(() =>
  import("./academic-years-page").then((m) => ({ default: m.AcademicYearsPage }))
);
const TimetablePage = lazy(() =>
  import("./timetable-page").then((m) => ({ default: m.TimetablePage }))
);
const StudentAttendancePage = lazy(() =>
  import("./student-attendance-page").then((m) => ({ default: m.StudentAttendancePage }))
);
const TeacherAttendancePage = lazy(() =>
  import("./teacher-attendance-page").then((m) => ({ default: m.TeacherAttendancePage }))
);
const LeaveRequestsPage = lazy(() =>
  import("./leave-requests-page").then((m) => ({ default: m.LeaveRequestsPage }))
);
const GradebookPage = lazy(() =>
  import("./gradebook-page").then((m) => ({ default: m.GradebookPage }))
);
const GradingRulesPage = lazy(() =>
  import("./grading-rules-page").then((m) => ({ default: m.GradingRulesPage }))
);
const ReportCardsPage = lazy(() =>
  import("./report-cards-page").then((m) => ({ default: m.ReportCardsPage }))
);
const FeeStructuresPage = lazy(() =>
  import("./fee-structures-page").then((m) => ({ default: m.FeeStructuresPage }))
);
const InvoicesPage = lazy(() =>
  import("./invoices-page").then((m) => ({ default: m.InvoicesPage }))
);
const ExpensesPage = lazy(() =>
  import("./expenses-page").then((m) => ({ default: m.ExpensesPage }))
);
const DummyPage = lazy(() =>
  import("./dummy-page").then((m) => ({ default: m.DummyPage }))
);

function PageFallback() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#45AC5E] border-t-transparent" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: (
      <LayoutShell>
        <Suspense fallback={<PageFallback />}>
          <LoginPage />
        </Suspense>
      </LayoutShell>
    ),
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminLayout />
          </Suspense>
        ),
        children: [
          {
            path: "/dashboard",
            element: (
              <Suspense fallback={<PageFallback />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: "/users",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="user" action="read">
                  <UsersPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/users/roles",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="role" action="read">
                  <RolesPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/students",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="student" action="read">
                  <StudentsPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/teachers",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="teacher" action="read">
                  <TeachersPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/users/teachers",
            element: <Navigate to="/teachers" replace />,
          },
          {
            path: "/academics/academic-years",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="academic_year" action="read">
                  <AcademicYearsPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/academics/programs",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="program" action="read">
                  <ProgramsPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/academics/classes",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="class" action="read">
                  <ClassesPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/academics/subjects",
            element: <Navigate to="/academics/programs" replace />,
          },
          {
            path: "/academics/timetable",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="timetable" action="read">
                  <TimetablePage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/academics",
            element: <Navigate to="/academics/classes" replace />,
          },
          {
            path: "/attendance/students",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="student_attendance" action="read">
                  <StudentAttendancePage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/attendance/teachers",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="teacher_attendance" action="read">
                  <TeacherAttendancePage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/attendance/leave-requests",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="leave_request" action="read">
                  <LeaveRequestsPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/attendance",
            element: <Navigate to="/attendance/students" replace />,
          },
          {
            path: "/examinations/gradebook",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="examination" action="read">
                  <GradebookPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/examinations/rules",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="examination" action="read">
                  <GradingRulesPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/examinations/report-cards",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="examination" action="read">
                  <ReportCardsPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/examinations",
            element: <Navigate to="/examinations/gradebook" replace />,
          },
          {
            path: "/fee-management/structures",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="fee" action="read">
                  <FeeStructuresPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/fee-management/invoices",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="fee" action="read">
                  <InvoicesPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/fee-management/expenses",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="fee" action="read">
                  <ExpensesPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/fee-management",
            element: <Navigate to="/fee-management/invoices" replace />,
          },
          {
            path: "/roles",
            element: <Navigate to="/users/roles" replace />,
          },
          {
            path: "/forbidden",
            element: <ForbiddenPage />,
          },
          {
            path: "*",
            element: (
              <Suspense fallback={<PageFallback />}>
                <DummyPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
