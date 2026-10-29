"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


import { ArrowRightIcon } from "lucide-react";

import {
  ErrorAlert,
  LoadingState,
  PageShell,
} from "@/components/page";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Account = {
  email: string;
  roles: string[];
};

const modules = [
  {
    title: "Courses",
    description: "Create, update and delete courses.",
    href: "/courses",
  },
  {
    title: "Students",
    description: "Register, search and manage students.",
    href: "/students",
  },
  {
    title: "Enrolments",
    description: "Manage student course enrolments.",
    href: "/enrolments",
  },
  {
    title: "Attendance",
    description: "Mark and correct student attendance.",
    href: "/attendance",
  },
  {
    title: "Attendance History",
    description: "View student attendance records and percentages.",
    href: "/attendance/history",
  },
  {
    title: "Lecturers",
    description: "Register lecturer accounts.",
    href: "/admin/lecturers",
  },
  {
    title: "Course lecturers",
    description: "Assign lecturers to courses.",
    href: "/admin/course-lecturers",
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load your account.");
        }

        const data: Account = await response.json();

        if (!data.roles.includes("ROLE_ADMIN")) {
          throw new Error("Administrator access is required.");
        }

        setAccount(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => controller.abort();
  }, [router]);

  return (
    <PageShell width="xl">
      {loading && <LoadingState label="Checking your account..." rows={1} />}

      <ErrorAlert message={error} />

      {!loading && !error && account && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="font-bold">{module.title}</CardTitle>
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
      )}
    </PageShell>
  );
}
