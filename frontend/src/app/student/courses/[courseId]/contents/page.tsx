"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Lesson = {
  id: number;
  title: string;
  body: string;
  updatedAt: string;
};

export default function StudentContentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLessons() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/student/courses/${courseId}/contents`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error(
            "You must be enrolled in this course to view its lessons."
          );
        }

        if (response.status === 404) {
          throw new Error(
            "Could not load lessons. Check that your student profile is complete."
          );
        }

        if (!response.ok) {
          throw new Error("Could not load course lessons.");
        }

        const data: Lesson[] = await response.json();

        if (!controller.signal.aborted) {
          setLessons(data);
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

    loadLessons();

    return () => controller.abort();
  }, [courseId, router]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link
        href="/student/courses"
        className="text-blue-600 underline"
      >
        Back to courses
      </Link>

      <h1 className="my-6 text-3xl font-bold">
        Course lessons
      </h1>

      {loading && <p role="status">Loading lessons...</p>}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && lessons.length === 0 && (
        <p>Your lecturer has not added any lessons yet.</p>
      )}

      {!loading && !error && lessons.length > 0 && (
        <div className="space-y-5">
          {lessons.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded border p-5"
            >
              <h2 className="text-xl font-semibold">
                {lesson.title}
              </h2>

              <p className="mt-4 whitespace-pre-wrap break-words">
                {lesson.body}
              </p>

              <p className="mt-4 text-sm">
                Updated:{" "}
                {new Date(lesson.updatedAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
