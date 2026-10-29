import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { PageHeader, PageShell } from "@/components/page";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <PageShell width="xl">
      <PageHeader
        title="Applebay Institute"
        description="Manage courses, students, enrolments and attendance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardFooter className="text-sm font-medium">
                Open module
                <ArrowRightIcon className="ml-1 size-4" />
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
