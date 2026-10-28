"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Course = {
  id: number;
  code: string;
  name: string;
  level: string;
  duration: string;
};

export default function LecturerDashboard() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        const response = await fetch("/api/lecturer/courses", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error("A Lecturer account is required.");
        }

        if (response.status === 404) {
          throw new Error(
            "Lecturer profile not found. Please contact the administrator."
          );
        }

        if (!response.ok) {
          throw new Error("Could not load your assigned courses.");
        }

        const data: Course[] = await response.json();

        if (!controller.signal.aborted) {
          setCourses(data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => controller.abort();
  }, [router]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-3xl font-bold">
        Lecturer dashboard
      </h1>

      <p className="mb-8">
        View the courses assigned to you.
      </p>

      {loading && (
        <p role="status">Loading your courses...</p>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && courses.length === 0 && (
        <p>
          No courses have been assigned to you yet.
          Please contact the administrator.
        </p>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <section
              key={course.id}
              className="rounded-lg border p-5"
            >
              <p className="text-sm">{course.code}</p>

              <h2 className="mt-1 text-xl font-semibold">
                {course.name}
              </h2>

              <p className="mt-4">Level: {course.level}</p>
              <p>Duration: {course.duration}</p>

              <Link
                href={`/lecturer/courses/${course.id}/sessions`}
                className="mt-4 inline-block rounded bg-blue-700 px-4 py-2 text-white"
              >
                Attendance sessions
              </Link>

              <Link
                href={`/lecturer/courses/${course.id}/report`}
                className="mt-4 ml-3 inline-block rounded border px-4 py-2"
              >
                Attendance report
              </Link>

              <Link
                href={`/lecturer/courses/${course.id}/contents`}
                className="mt-4 ml-3 inline-block rounded border px-4 py-2"
              >
                Course content
              </Link>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
