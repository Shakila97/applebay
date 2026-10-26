"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../LogoutButton";

type Profile = {
  name: string;
  registrationNumber: string;
};

export default function StudentDashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await fetch("/api/student/profile", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error("This dashboard requires a Student account.");
        }

        if (response.status === 404) {
          setNeedsProfile(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load your profile.");
        }

        setProfile(await response.json());
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

    loadDashboard();

    return () => controller.abort();
  }, [router]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Student dashboard</h1>

      <div className="mb-6">
        <LogoutButton />
      </div>

      {loading && <p role="status">Loading your account...</p>}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && needsProfile && (
        <section className="rounded border p-5">
          <h2 className="mb-2 text-xl font-semibold">
            Complete your registration
          </h2>

          <p className="mb-4">
            Add your student details to receive your registration number.
          </p>

          <Link
            href="/student/profile"
            className="inline-block rounded bg-blue-700 px-4 py-2 text-white"
          >
            Complete profile
          </Link>
        </section>
      )}

      {!loading && !error && profile && (
        <section className="rounded border p-5">
          <h2 className="text-xl font-semibold">
            Welcome, {profile.name}
          </h2>

          <p className="mt-3">
            Registration number:{" "}
            <strong>{profile.registrationNumber}</strong>
          </p>

          <Link
            href="/student/courses"
            className="mt-5 inline-block rounded bg-blue-700 px-4 py-2 text-white"
          >
            Browse courses
          </Link>

          <Link
            href="/student/attendance"
            className="mt-4 inline-block rounded border px-4 py-2"
          >
            View my attendance
          </Link>
        </section>
      )}
    </main>
  );
}
