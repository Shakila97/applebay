"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "./LogoutButton";

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
      <main className="mx-auto max-w-xl p-6">
        <p role="alert">{failure.message}</p>
        <Link href="/login" className="mt-4 inline-block underline">
          Go to login
        </Link>
      </main>
    );
  }

  if (pathname === "/" || result?.path !== pathname) {
    return <p className="p-6" role="status">Checking access...</p>;
  }

  const account = result.account;
  const dashboard = dashboardFor(account)!;

  if (!canAccess(pathname, account)) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="my-4">
          Your account does not have permission to open this page.
        </p>
        <Link href={dashboard} className="text-blue-600 underline">
          Go to my dashboard
        </Link>
      </main>
    );
  }

  const links = account.roles.includes("ROLE_ADMIN")
    ? adminLinks
    : account.roles.includes("ROLE_LECTURER")
      ? lecturerLinks
      : studentLinks;

  return (
    <>
      <header className="border-b">
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xl font-bold">Applebay Institute</p>
              <p className="text-sm">{account.email}</p>
            </div>
            <LogoutButton />
          </div>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap gap-2"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  pathname === link.href ? "page" : undefined
                }
                className={
                  pathname === link.href
                    ? "rounded bg-blue-700 px-3 py-2 text-white"
                    : "rounded border px-3 py-2"
                }
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
