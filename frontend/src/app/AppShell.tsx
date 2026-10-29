"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "./LogoutButton";

import { EmptyState, ErrorAlert, PageShell } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Account = {
  email: string;
  roles: string[];
};

type CheckResult = {
  path: string;
  account: Account;
};

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/students", label: "Students" },
  { href: "/enrolments", label: "Enrolments" },
  { href: "/attendance", label: "Attendance" },
  { href: "/attendance/history", label: "Attendance History" },
  { href: "/admin/lecturers", label: "Lecturers" },
  { href: "/admin/course-lecturers", label: "Course Lecturers" },
];

const studentLinks = [
  { href: "/student", label: "Dashboard" },
  { href: "/student/courses", label: "Courses" },
  { href: "/student/attendance", label: "My Attendance" },
];

const lecturerLinks = [
  { href: "/lecturer", label: "Dashboard" },
];

function within(path: string, base: string) {
  return path === base || path.startsWith(`${base}/`);
}

function dashboardFor(account: Account) {
  if (account.roles.includes("ROLE_ADMIN")) return "/admin";
  if (account.roles.includes("ROLE_LECTURER")) return "/lecturer";
  if (account.roles.includes("ROLE_STUDENT")) return "/student";

  return null;
}

function canAccess(path: string, account: Account) {
  if (account.roles.includes("ROLE_ADMIN")) {
    return [
      "/admin",
      "/courses",
      "/students",
      "/enrolments",
      "/attendance",
    ].some((base) => within(path, base));
  }

  if (account.roles.includes("ROLE_LECTURER")) {
    return within(path, "/lecturer");
  }

  if (account.roles.includes("ROLE_STUDENT")) {
    return within(path, "/student");
  }

  return false;
}

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const publicPage =
    pathname === "/login" || pathname === "/signup";

  const [result, setResult] = useState<CheckResult | null>(null);
  const [failure, setFailure] = useState<{
    path: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (publicPage) return;

    const controller = new AbortController();

    async function checkSession() {
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
          throw new Error("Could not verify your login. Please try again.");
        }

        const account: Account = await response.json();

        if (controller.signal.aborted) return;

        const dashboard = dashboardFor(account);

        if (!dashboard) {
          throw new Error("Your account has no supported role.");
        }

        if (pathname === "/") {
          router.replace(dashboard);
          return;
        }

        setResult({ path: pathname, account });
        setFailure(null);
      } catch (error) {
        if (controller.signal.aborted) return;

        setFailure({
          path: pathname,
          message:
            error instanceof Error
              ? error.message
              : "Could not verify your login.",
        });
      }
    }

    checkSession();

    return () => controller.abort();
  }, [pathname, publicPage, router]);

  // No management navigation on login/signup pages.
  if (publicPage) {
    return <>{children}</>;
  }

  if (failure?.path === pathname) {
    return (
      <PageShell width="sm">
        <ErrorAlert
          title="Could not open this page"
          message={failure.message}
        />
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "self-start")}
        >
          Go to login
        </Link>
      </PageShell>
    );
  }

  if (pathname === "/" || result?.path !== pathname) {
    return (
      <div
        role="status"
        className="flex flex-1 items-center justify-center gap-2 p-6 text-muted-foreground"
      >
        <Spinner />
        Checking access...
      </div>
    );
  }

  const account = result.account;
  const dashboard = dashboardFor(account)!;

  if (!canAccess(pathname, account)) {
    return (
      <PageShell width="sm">
        <EmptyState
          title="Access denied"
          description="Your account does not have permission to open this page."
        >
          <Link href={dashboard} className={buttonVariants()}>
            Go to my dashboard
          </Link>
        </EmptyState>
      </PageShell>
    );
  }

  const links = account.roles.includes("ROLE_ADMIN")
    ? adminLinks
    : account.roles.includes("ROLE_LECTURER")
      ? lecturerLinks
      : studentLinks;

  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-lg font-semibold">Applebay Institute</p>
              <p className="text-sm text-muted-foreground">
                {account.email}
              </p>
            </div>
            <LogoutButton />
          </div>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap gap-1"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  pathname === link.href ? "page" : undefined
                }
                className={buttonVariants({
                  variant: pathname === link.href ? "secondary" : "ghost",
                  size: "sm",
                })}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}
    </>
  );
}
