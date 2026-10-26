"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LogoutButton from "../LogoutButton";

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
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Admin dashboard</h1>

      {loading && <p role="status">Checking your account...</p>}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && account && (
        <>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p>Signed in as {account.email}</p>
            <LogoutButton />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="rounded border p-5 hover:border-blue-600"
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
        </>
      )}
    </main>
  );
}
