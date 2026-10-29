"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

import { OptionSelect } from "@/components/option-select";
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
  StatusBadge,
  SuccessAlert,
} from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Course = {
  id: number;
  code: string;
  name: string;
};

type Enrolment = {
  id: number;
  student: {
    id: number;
    name: string;
    nic: string;
  };
};

type Attendance = {
  id: number;
  enrolment: {
    id: number;
  };
  status: "Present" | "Absent";
};

function today() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(today);

  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [marks, setMarks] = useState<Record<number, string>>({});

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        const response = await fetch("/api/courses", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load courses.");
        }

        setCourses(await response.json());
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => controller.abort();
  }, []);

  async function loadRoster(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setLoaded(false);
    setError("");
    setMessage("");

    try {
      const [enrolmentResponse, attendanceResponse] = await Promise.all([
        fetch(`/api/enrolments/courses/${courseId}`, {
          cache: "no-store",
        }),
        fetch(`/api/attendance/courses/${courseId}?date=${date}`, {
          cache: "no-store",
        }),
      ]);

      if (!enrolmentResponse.ok || !attendanceResponse.ok) {
        throw new Error("Could not load students and attendance.");
      }

      const enrolmentData: Enrolment[] = await enrolmentResponse.json();
      const attendanceData: Attendance[] = await attendanceResponse.json();

      const savedMarks: Record<number, string> = {};

      attendanceData.forEach((record) => {
        savedMarks[record.enrolment.id] = record.status;
      });

      setEnrolments(enrolmentData);
      setMarks(savedMarks);
      setLoaded(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function markAttendance(
    enrolmentId: number,
    status: "Present" | "Absent"
  ) {
    setSavingId(enrolmentId);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("/api/attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enrolmentId,
          date,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save attendance. Please try again.");
      }

      setMarks((current) => ({
        ...current,
        [enrolmentId]: status,
      }));

      setMessage("Attendance saved successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSavingId(null);
    }
  }

  const busy = loading || savingId !== null;

  return (
    <PageShell>
      <PageHeader title="Attendance" />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      {loadingCourses ? (
        <LoadingState label="Loading courses..." rows={1} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose a class</CardTitle>
            {courses.length === 0 && (
              <CardDescription>Add a course first.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form id="roster-form" onSubmit={loadRoster}>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="roster-course">Course</FieldLabel>
                  <OptionSelect
                    id="roster-course"
                    required
                    placeholder="Choose a course"
                    disabled={busy || courses.length === 0}
                    value={courseId}
                    onChange={(value) => {
                      setCourseId(value);
                      setLoaded(false);
                      setMessage("");
                    }}
                    options={courses.map((course) => ({
                      value: String(course.id),
                      label: `${course.code} — ${course.name}`,
                    }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="roster-date">Date</FieldLabel>
                  <Input
                    id="roster-date"
                    required
                    type="date"
                    max={today()}
                    disabled={busy || courses.length === 0}
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setLoaded(false);
                      setMessage("");
                    }}
                  />
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              form="roster-form"
              disabled={busy || courses.length === 0 || !courseId}
            >
              {loading && <Spinner data-icon="inline-start" />}
              {loading ? "Loading..." : "Load students"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {loaded && enrolments.length === 0 && (
        <EmptyState title="No students are enrolled in this course" />
      )}

      {loaded && enrolments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>
              Each Present or Absent button saves immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Saved status</TableHead>
                  <TableHead className="text-right">Mark attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolments.map((enrolment) => {
                  const mark = marks[enrolment.id] ?? "Unmarked";

                  return (
                    <TableRow key={enrolment.id}>
                      <TableCell className="font-medium">
                        {enrolment.student.name}
                      </TableCell>
                      <TableCell className="font-mono">
                        {enrolment.student.nic}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={mark} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {savingId === enrolment.id && (
                            <Spinner aria-label="Saving" />
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={mark === "Present" ? "default" : "outline"}
                            disabled={busy}
                            onClick={() =>
                              markAttendance(enrolment.id, "Present")
                            }
                          >
                            Present
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              mark === "Absent" ? "destructive" : "outline"
                            }
                            disabled={busy}
                            onClick={() =>
                              markAttendance(enrolment.id, "Absent")
                            }
                          >
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
