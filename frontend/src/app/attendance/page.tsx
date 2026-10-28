"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

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
  const inputStyle = "mt-1 w-full rounded border p-2";

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Attendance</h1>

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

      {loadingCourses ? (
        <p role="status">Loading courses...</p>
      ) : (
        <form
          onSubmit={loadRoster}
          className="mb-8 rounded border p-5"
        >
          <fieldset
            disabled={busy || courses.length === 0}
            className="space-y-4"
          >
            <label className="block">
              Course
              <select
                required
                value={courseId}
                onChange={(event) => {
                  setCourseId(event.target.value);
                  setLoaded(false);
                  setMessage("");
                }}
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
              Date
              <input
                required
                type="date"
                max={today()}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setLoaded(false);
                  setMessage("");
                }}
                className={inputStyle}
              />
            </label>

            <button
              type="submit"
              className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load students"}
            </button>
          </fieldset>

          {courses.length === 0 && (
            <p className="mt-3">Add a course first.</p>
          )}
        </form>
      )}

      {loaded && enrolments.length === 0 && (
        <p>No students are enrolled in this course.</p>
      )}

      {loaded && enrolments.length > 0 && (
        <>
          <p className="mb-4">
            Each Present or Absent button saves immediately.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Student</th>
                  <th className="p-3">NIC</th>
                  <th className="p-3">Saved status</th>
                  <th className="p-3">Mark attendance</th>
                </tr>
              </thead>

              <tbody>
                {enrolments.map((enrolment) => (
                  <tr key={enrolment.id} className="border-b">
                    <td className="p-3">{enrolment.student.name}</td>
                    <td className="p-3">{enrolment.student.nic}</td>
                    <td className="p-3">
                      {marks[enrolment.id] ?? "Unmarked"}
                    </td>
                    <td className="p-3">
                      {savingId === enrolment.id ? (
                        <span role="status">Saving...</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              markAttendance(enrolment.id, "Present")
                            }
                            className="rounded bg-green-700 px-3 py-2 text-white disabled:opacity-50"
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              markAttendance(enrolment.id, "Absent")
                            }
                            className="rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50"
                          >
                            Absent
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
