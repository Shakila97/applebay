import Link from "next/link";

const modules = [
  {
    title: "Courses",
    description: "Add, view, edit and delete courses.",
    href: "/courses",
  },
  {
    title: "Students",
    description: "Register, search and manage students.",
    href: "/students",
  },
  {
    title: "Enrolments",
    description: "Enrol students in courses.",
    href: "/enrolments",
  },
  {
    title: "Mark Attendance",
    description: "Record attendance for a course and date.",
    href: "/attendance",
  },
  {
    title: "Attendance History",
    description: "View student records and attendance percentages.",
    href: "/attendance/history",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-3 text-3xl font-bold">
        Applebay Institute
      </h1>

      <p className="mb-8">
        Manage courses, students, enrolments and attendance.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-lg border p-6 transition-colors hover:border-blue-600"
          >
            <h2 className="mb-2 text-xl font-semibold">
              {module.title}
            </h2>

            <p>{module.description}</p>

            <p className="mt-4 font-semibold text-blue-600">
              Open module →
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
