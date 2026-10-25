"use client";

import { useEffect, useState } from "react";
import CourseForm from "./CourseForm";

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
    setLoading(true);
    setError("");

    loadCourses();

    return () => controller.abort();
  },[refreshKey]);

  async function deleteCourse(id: number) {
    if (!window.confirm("Delete this course?")) return;

    setDeletingId(id);
    setDeleteError("");

    try {
      const response = await fetch(`/api/courses/${id}`, {
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
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Courses</h1>

      <CourseForm
        key={editingCourse?.id ?? "new"}
        course={editingCourse}
        onSaved={() => {
          setEditingCourse(null);
          setRefreshKey((value) => value + 1);
        }}
        onCancel={() => setEditingCourse(null)}
      />

      {deleteError && (
        <p role="alert" className="mb-4 text-red-600">
          {deleteError}
        </p>
      )}

      {loading && <p role="status">Loading courses...</p>}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && courses.length === 0 && (
        <p>No courses found.</p>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Level</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b">
                  <td className="p-3">{course.code}</td>
                  <td className="p-3">{course.name}</td>
                  <td className="p-3">{course.level}</td>
                  <td className="p-3">{course.duration}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => {
                        setEditingCourse(course);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="mr-2 rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => deleteCourse(course.id)}
                      className="rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50"
                    >
                      {deletingId === course.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}