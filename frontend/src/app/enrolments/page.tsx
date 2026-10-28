"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

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

  const inputStyle = "mt-1 w-full rounded border p-2";

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Enrolments</h1>

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
            onSubmit={handleSubmit}
            className="mb-8 rounded border p-5"
          >
            <h2 className="mb-4 text-xl font-semibold">
              Enrol a student
            </h2>

            <fieldset
              disabled={saving || !students.length || !courses.length}
              className="space-y-4"
            >
              <label className="block">
                Student
                <select
                  required
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  className={inputStyle}
                >
                  <option value="">Choose a student</option>

                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} — {student.nic}
                    </option>
                  ))}
                </select>
              </label>

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

              <button
                type="submit"
                className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Enrol student"}
              </button>
            </fieldset>

            {(!students.length || !courses.length) && (
              <p className="mt-3">
                Add at least one student and one course first.
              </p>
            )}
          </form>

          <h2 className="mb-4 text-xl font-semibold">
            Saved enrolments
          </h2>

          {enrolments.length === 0 ? (
            <p>No enrolments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Student</th>
                    <th className="p-3">NIC</th>
                    <th className="p-3">Course</th>
                  </tr>
                </thead>

                <tbody>
                  {enrolments.map((enrolment) => (
                    <tr key={enrolment.id} className="border-b">
                      <td className="p-3">
                        {enrolment.student.name}
                      </td>
                      <td className="p-3">
                        {enrolment.student.nic}
                      </td>
                      <td className="p-3">
                        {enrolment.course.code} — {enrolment.course.name}
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
