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
  SuccessAlert,
} from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

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

  async function unenrol(course: Course) {
    if (
      !window.confirm(
        `Unenrol from ${course.name}? Your attendance for this course will also be deleted.`
      )
    )
      return;

    setSavingId(course.id);
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
        `/api/student/courses/${course.id}/enrolments`,
        {
          method: "DELETE",
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

      if (!response.ok && response.status !== 404) {
        throw new Error("Could not unenrol. Please try again.");
      }

      setEnrolments((current) =>
        current.filter((enrolment) => enrolment.course.id !== course.id)
      );
      setMessage(`You unenrolled from ${course.name}.`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSavingId(null);
    }
  }

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
    <PageShell>
      <PageHeader
        backHref="/student"
        title="Browse courses"
        description="Enrol in a course to see its lessons and attendance sessions."
      />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      {loading ? (
        <LoadingState label="Loading courses..." />
      ) : courses.length === 0 ? (
        <EmptyState title="No courses are available" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const enrolled = enrolments.some(
              (enrolment) => enrolment.course.id === course.id
            );

            return (
              <Card key={course.id}>
                <CardHeader>
                  <CardDescription className="font-mono">
                    {course.code}
                  </CardDescription>
                  <CardTitle>{course.name}</CardTitle>
                  {enrolled && (
                    <CardAction>
                      <Badge variant="secondary">Enrolled</Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Level: {course.level}</p>
                  <p>Duration: {course.duration}</p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {enrolled ? (
                    <>
                      <Link
                        href={`/student/courses/${course.id}/contents`}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        View lessons
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive"
                        disabled={savingId !== null}
                        onClick={() => unenrol(course)}
                      >
                        {savingId === course.id && (
                          <Spinner data-icon="inline-start" />
                        )}
                        {savingId === course.id ? "Unenrolling..." : "Unenrol"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      disabled={savingId !== null}
                      onClick={() => enrol(course.id)}
                    >
                      {savingId === course.id && (
                        <Spinner data-icon="inline-start" />
                      )}
                      {savingId === course.id ? "Enrolling..." : "Enrol"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
