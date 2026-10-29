"use client";

import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/apiFetch";

import { Trash2Icon } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Lecturer = {
  id: number;
  name: string;
  email: string;
};

type Assignment = {
  id: number;
  courseId: number;
  courseName: string;
  lecturerId: number;
  lecturerName: string;
};

export default function CourseLecturersPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [courseId, setCourseId] = useState("");
  const [lecturerId, setLecturerId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const responses = await Promise.all([
          fetch("/api/courses", {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch("/api/admin/lecturers", {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch("/api/admin/course-lecturers", {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (responses.some((response) => !response.ok)) {
          throw new Error(
            "Could not load courses or lecturers. Check your Admin session."
          );
        }

        const [courseData, lecturerData, assignmentData] =
          await Promise.all(responses.map((response) => response.json()));

        setCourses(courseData);
        setLecturers(lecturerData);
        setAssignments(assignmentData);
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

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("/api/admin/course-lecturers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: Number(courseId),
          lecturerId: Number(lecturerId),
        }),
      });

      if (response.status === 409) {
        throw new Error(
          "Could not assign this lecturer. They may already be assigned to this course."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not save the assignment. Check your Admin session."
        );
      }

      const assignment: Assignment = await response.json();

      setAssignments((current) => [...current, assignment]);
      setCourseId("");
      setLecturerId("");
      setMessage("Lecturer assigned successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(id: number) {
    if (!window.confirm("Remove this lecturer from this course?")) return;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/admin/course-lecturers/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(
          "Could not remove the assignment. Check your Admin session."
        );
      }

      setAssignments((current) =>
        current.filter((assignment) => assignment.id !== id)
      );

      setMessage("Lecturer assignment removed.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }


  const formDisabled =
    saving ||
    deletingId !== null ||
    courses.length === 0 ||
    lecturers.length === 0;

  const courseItems = [
    { label: "Choose a course", value: null },
    ...courses.map((course) => ({
      label: `${course.code} — ${course.name}`,
      value: String(course.id),
    })),
  ];

  const lecturerItems = [
    { label: "Choose a lecturer", value: null },
    ...lecturers.map((lecturer) => ({
      label: `${lecturer.name} — ${lecturer.email}`,
      value: String(lecturer.id),
    })),
  ];

  return (
    <PageShell>
      <PageHeader backHref="/admin" title="Assign lecturers to courses" />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>New assignment</CardTitle>
              {(courses.length === 0 || lecturers.length === 0) && (
                <CardDescription>
                  Create at least one course and register one lecturer first.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form id="assign-form" onSubmit={handleAssign}>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="course">Course</FieldLabel>
                    <Select
                      required
                      items={courseItems}
                      disabled={formDisabled}
                      value={courseId || null}
                      onValueChange={(value) => setCourseId(value ?? "")}
                    >
                      <SelectTrigger id="course" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {courseItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lecturer">Lecturer</FieldLabel>
                    <Select
                      required
                      items={lecturerItems}
                      disabled={formDisabled}
                      value={lecturerId || null}
                      onValueChange={(value) => setLecturerId(value ?? "")}
                    >
                      <SelectTrigger id="lecturer" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {lecturerItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="assign-form"
                disabled={formDisabled || !courseId || !lecturerId}
              >
                {saving && <Spinner data-icon="inline-start" />}
                {saving ? "Saving..." : "Assign lecturer"}
              </Button>
            </CardFooter>
          </Card>

          <h2 className="text-lg font-semibold">Current assignments</h2>

          {assignments.length === 0 ? (
            <EmptyState title="No lecturers assigned yet" />
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Lecturer</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.courseName}
                        </TableCell>
                        <TableCell>{assignment.lecturerName}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={saving || deletingId !== null}
                            onClick={() => removeAssignment(assignment.id)}
                          >
                            {deletingId === assignment.id ? (
                              <Spinner data-icon="inline-start" />
                            ) : (
                              <Trash2Icon data-icon="inline-start" />
                            )}
                            {deletingId === assignment.id
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
