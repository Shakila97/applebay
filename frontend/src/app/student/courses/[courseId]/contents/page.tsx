"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
} from "@/components/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <PageShell width="md">
      <PageHeader
        backHref="/student/courses"
        backLabel="Back to courses"
        title="Course lessons"
      />

      {loading && <LoadingState label="Loading lessons..." />}

      <ErrorAlert message={error} />

      {!loading && !error && lessons.length === 0 && (
        <EmptyState
          title="No lessons yet"
          description="Your lecturer has not added any lessons yet."
        />
      )}

      {!loading && !error && lessons.length > 0 && (
        <div className="flex flex-col gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <CardTitle>{lesson.title}</CardTitle>
                <CardDescription>
                  Updated {new Date(lesson.updatedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words">
                  {lesson.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
