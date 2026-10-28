"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/apiFetch";

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

  const inputStyle = "mt-1 w-full rounded border p-2";

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/admin" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">
        Assign lecturers to courses
      </h1>

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
        <p role="status">Loading...</p>
      ) : (
        <>
          <form
            onSubmit={handleAssign}
            className="mb-8 rounded border p-5"
          >
            <fieldset
              disabled={
                saving ||
                deletingId !== null ||
                courses.length === 0 ||
                lecturers.length === 0
              }
              className="space-y-4"
            >
              <label className="block">
                Course
                <select
                  required
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className={inputStyle}
                >
                  <option value="">Choose a course</option>

                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                Lecturer
                <select
                  required
                  value={lecturerId}
                  onChange={(event) => setLecturerId(event.target.value)}
                  className={inputStyle}
                >
                  <option value="">Choose a lecturer</option>

                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name} — {lecturer.email}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Assign lecturer"}
              </button>
            </fieldset>

            {(courses.length === 0 || lecturers.length === 0) && (
              <p className="mt-3">
                Create at least one course and register one lecturer first.
              </p>
            )}
          </form>

          <h2 className="mb-4 text-xl font-semibold">
            Current assignments
          </h2>

          {assignments.length === 0 ? (
            <p>No lecturers assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Course</th>
                    <th className="p-3">Lecturer</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b">
                      <td className="p-3">{assignment.courseName}</td>
                      <td className="p-3">{assignment.lecturerName}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={saving || deletingId !== null}
                          onClick={() => removeAssignment(assignment.id)}
                          className="rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50"
                        >
                          {deletingId === assignment.id ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
