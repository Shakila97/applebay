"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CourseForm from "./CourseForm";
import { apiFetch } from "@/lib/apiFetch";

import { PencilIcon, Trash2Icon } from "lucide-react";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
} from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  level: string;
  duration: string;
};

export default function CoursesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/courses", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load courses.");
        }

        const data: Course[] = await response.json();
        setCourses(data);
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
  },[refreshKey]);

  async function deleteCourse(id: number) {
    if (!window.confirm("Delete this course?")) return;

    setDeletingId(id);
    setDeleteError("");

    try {
      const response = await apiFetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          "Could not delete the course. Check whether students are enrolled in it."
        );
      }

      if (editingCourse?.id === id) {
        setEditingCourse(null);
      }

      setCourses((current) =>
        current.filter((course) => course.id !== id)
      );
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageShell>
      <PageHeader title="Courses" />

      <CourseForm
        key={editingCourse?.id ?? "new"}
        course={editingCourse}
        onSaved={() => {
          setEditingCourse(null);
          setRefreshKey((value) => value + 1);
        }}
        onCancel={() => setEditingCourse(null)}
      />

      <ErrorAlert message={deleteError} title="Could not delete course" />

      {loading && <LoadingState label="Loading courses..." />}

      <ErrorAlert message={error} />

      {!loading && !error && courses.length === 0 && (
        <EmptyState title="No courses found" />
      )}

      {!loading && !error && courses.length > 0 && (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono">{course.code}</TableCell>
                    <TableCell className="font-medium">
                      {course.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{course.level}</Badge>
                    </TableCell>
                    <TableCell>{course.duration}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/courses/${course.id}/contents`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Content
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deletingId !== null}
                          onClick={() => {
                            setEditingCourse(course);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <PencilIcon data-icon="inline-start" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deletingId !== null}
                          onClick={() => deleteCourse(course.id)}
                        >
                          {deletingId === course.id ? (
                            <Spinner data-icon="inline-start" />
                          ) : (
                            <Trash2Icon data-icon="inline-start" />
                          )}
                          {deletingId === course.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
