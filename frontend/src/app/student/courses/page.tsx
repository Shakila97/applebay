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

type Enrolment = {
  id: number;
  course: Course;
};

type CsrfResponse = {
  token: string;
  headerName: string;
};

export default function StudentCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        const responses = await Promise.all([
          fetch("/api/student/courses", {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/student/enrolments", {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (responses.some((response) => response.status === 401)) {
          router.replace("/login");
          return;
        }

        if (responses.some((response) => response.status === 403)) {
          throw new Error("A Student account is required.");
        }

        if (responses.some((response) => response.status === 404)) {
          throw new Error(
            "Could not load your courses. Complete your student profile first."
          );
        }

        if (responses.some((response) => !response.ok)) {
          throw new Error("Could not load courses.");
        }

        const [courseData, enrolmentData] = await Promise.all(
          responses.map((response) => response.json())
        );

        setCourses(courseData);
        setEnrolments(enrolmentData);
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

    loadCourses();

    return () => controller.abort();
  }, [router]);

  async function enrol(courseId: number) {
    setSavingId(courseId);
    setError("");
    setMessage("");

    try {
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not prepare your request.");
      }

      const csrf: CsrfResponse = await csrfResponse.json();

      const response = await fetch(
        `/api/student/courses/${courseId}/enrolments`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            [csrf.headerName]: csrf.token,
          },
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 409) {
        throw new Error(
          "Enrolment could not be saved. Refresh to check whether you are already enrolled."
        );
      }

      if (!response.ok) {
        throw new Error("Could not enrol. Please try again.");
      }

      const saved: Enrolment = await response.json();

      setEnrolments((current) => [...current, saved]);
      setMessage("You enrolled successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/student" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">Browse courses</h1>

      {error && (
        <p role="alert" className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-4 text-green-700">
          {message}
        </p>
      )}

      {loading ? (
        <p role="status">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p>No courses are available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const enrolled = enrolments.some(
              (enrolment) => enrolment.course.id === course.id
            );

            return (
              <section key={course.id} className="rounded border p-5">
                <p className="text-sm">{course.code}</p>
                <h2 className="mt-1 text-xl font-semibold">
                  {course.name}
                </h2>

                <p className="mt-3">Level: {course.level}</p>
                <p>Duration: {course.duration}</p>

                <button
                  type="button"
                  disabled={enrolled || savingId !== null}
                  onClick={() => enrol(course.id)}
                  className="mt-4 rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
                >
                  {enrolled
                    ? "Enrolled"
                    : savingId === course.id
                      ? "Enrolling..."
                      : "Enrol"}
                </button>

                {enrolled && (
                  <Link
                    href={`/student/courses/${course.id}/contents`}
                    className="mt-4 block text-blue-600 underline"
                  >
                    View lessons
                  </Link>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
