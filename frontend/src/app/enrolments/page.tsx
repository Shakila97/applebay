"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2Icon } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

import { OptionSelect } from "@/components/option-select";
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Student = {
  id: number;
  name: string;
  nic: string;
};

type Course = {
  id: number;
  code: string;
  name: string;
};

type Enrolment = {
  id: number;
  student: Student;
  course: Course;
};

export default function EnrolmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);

  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const responses = await Promise.all([
          fetch("/api/students", {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch("/api/courses", {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch("/api/enrolments", {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (responses.some((response) => !response.ok)) {
          throw new Error("Could not load enrolment data.");
        }

        const [studentData, courseData, enrolmentData] =
          await Promise.all(responses.map((response) => response.json()));

        setStudents(studentData);
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

    loadData();

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("/api/enrolments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: Number(studentId),
          courseId: Number(courseId),
        }),
      });

      if (response.status === 409) {
        throw new Error("This student is already enrolled in this course.");
      }

      if (!response.ok) {
        throw new Error("Could not save the enrolment.");
      }

      const saved: Enrolment = await response.json();

      setEnrolments((current) => [...current, saved]);
      setStudentId("");
      setCourseId("");
      setMessage("Student enrolled successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeEnrolment(enrolment: Enrolment) {
    if (
      !window.confirm(
        `Unenrol ${enrolment.student.name} from ${enrolment.course.name}? Their attendance for this course will also be deleted.`
      )
    )
      return;

    setDeletingId(enrolment.id);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`/api/enrolments/${enrolment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          "Could not remove the enrolment. Check your Admin session."
        );
      }

      setEnrolments((current) =>
        current.filter((item) => item.id !== enrolment.id)
      );
      setMessage("Student unenrolled.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const formDisabled = saving || !students.length || !courses.length;

  return (
    <PageShell>
      <PageHeader title="Enrolments" />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Enrol a student</CardTitle>
              {(!students.length || !courses.length) && (
                <CardDescription>
                  Add at least one student and one course first.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form id="enrol-form" onSubmit={handleSubmit}>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="enrol-student">Student</FieldLabel>
                    <OptionSelect
                      id="enrol-student"
                      required
                      placeholder="Choose a student"
                      disabled={formDisabled}
                      value={studentId}
                      onChange={setStudentId}
                      options={students.map((student) => ({
                        value: String(student.id),
                        label: `${student.name} — ${student.nic}`,
                      }))}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="enrol-course">Course</FieldLabel>
                    <OptionSelect
                      id="enrol-course"
                      required
                      placeholder="Choose a course"
                      disabled={formDisabled}
                      value={courseId}
                      onChange={setCourseId}
                      options={courses.map((course) => ({
                        value: String(course.id),
                        label: `${course.code} — ${course.name}`,
                      }))}
                    />
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="enrol-form"
                disabled={formDisabled || !studentId || !courseId}
              >
                {saving && <Spinner data-icon="inline-start" />}
                {saving ? "Saving..." : "Enrol student"}
              </Button>
            </CardFooter>
          </Card>

          <h2 className="text-lg font-semibold">Saved enrolments</h2>

          {enrolments.length === 0 ? (
            <EmptyState title="No enrolments found" />
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>NIC</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolments.map((enrolment) => (
                      <TableRow key={enrolment.id}>
                        <TableCell className="font-medium">
                          {enrolment.student.name}
                        </TableCell>
                        <TableCell className="font-mono">
                          {enrolment.student.nic}
                        </TableCell>
                        <TableCell>
                          {enrolment.course.code} — {enrolment.course.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={saving || deletingId !== null}
                            onClick={() => removeEnrolment(enrolment)}
                          >
                            {deletingId === enrolment.id ? (
                              <Spinner data-icon="inline-start" />
                            ) : (
                              <Trash2Icon data-icon="inline-start" />
                            )}
                            {deletingId === enrolment.id
                              ? "Removing..."
                              : "Remove"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
