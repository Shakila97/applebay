"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
} from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <PageShell width="xl">
      <PageHeader
        title="Lecturer dashboard"
        description="View the courses assigned to you."
      />

      {loading && <LoadingState label="Loading your courses..." />}

      <ErrorAlert message={error} />

      {!loading && !error && courses.length === 0 && (
        <EmptyState
          title="No courses assigned"
          description="No courses have been assigned to you yet. Please contact the administrator."
        />
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardDescription className="font-mono">
                  {course.code}
                </CardDescription>
                <CardTitle>{course.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Level: {course.level}</p>
                <p>Duration: {course.duration}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Link
                  href={`/lecturer/courses/${course.id}/sessions`}
                  className={buttonVariants()}
                >
                  Attendance sessions
                </Link>
                <Link
                  href={`/lecturer/courses/${course.id}/report`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Attendance report
                </Link>
                <Link
                  href={`/lecturer/courses/${course.id}/contents`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Course content
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
