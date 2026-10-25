"use client";

import { useEffect, useState, type FormEvent } from "react";

type Student = {
  id: number;
  name: string;
  nic: string;
};

type Attendance = {
  id: number;
  attendanceDate: string;
  status: "Present" | "Absent";
  enrolment: {
    course: {
      code: string;
      name: string;
    };
  };
};

type Summary = {
  present: number;
  total: number;
  percentage: number | null;
};

export default function AttendanceHistoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      try {
        const response = await fetch("/api/students", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load students.");
        }

        setStudents(await response.json());
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStudents(false);
        }
      }
    }

    loadStudents();

    return () => controller.abort();
  }, []);

  async function loadHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSummary(null);
    setRecords([]);

    try {
      const [recordsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/attendance/students/${studentId}`, {
          cache: "no-store",
        }),
        fetch(`/api/attendance/students/${studentId}/summary`, {
          cache: "no-store",
        }),
      ]);

      if (!recordsResponse.ok || !summaryResponse.ok) {
        throw new Error("Could not load attendance history.");
      }

      const recordData: Attendance[] = await recordsResponse.json();
      const summaryData: Summary = await summaryResponse.json();

      setRecords(recordData);
      setSummary(summaryData);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Student attendance history
      </h1>

      {error && (
        <p role="alert" className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {loadingStudents ? (
        <p role="status">Loading students...</p>
      ) : (
        <form
          onSubmit={loadHistory}
          className="mb-8 rounded border p-5"
        >
          <fieldset
            disabled={loading || students.length === 0}
            className="space-y-4"
          >
            <label className="block">
              Student
              <select
                required
                value={studentId}
                onChange={(event) => {
                  setStudentId(event.target.value);
                  setSummary(null);
                  setRecords([]);
                  setError("");
                }}
                className="mt-1 w-full rounded border p-2"
              >
                <option value="">Choose a student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} — {student.nic}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "View attendance"}
            </button>
          </fieldset>

          {students.length === 0 && (
            <p className="mt-3">Register a student first.</p>
          )}
        </form>
      )}

      {summary && (
        <>
          <section className="mb-6 rounded border p-5">
            <h2 className="text-xl font-semibold">
              Attendance percentage
            </h2>

            <p className="my-3 text-3xl font-bold">
              {summary.percentage === null
                ? "No records"
                : `${summary.percentage}%`}
            </p>

            <p>
              Present: {summary.present} / Recorded: {summary.total}
            </p>

            <p className="mt-2 text-sm">
              Calculated across all courses. Unmarked dates are excluded.
            </p>
          </section>

          {records.length === 0 ? (
            <p>No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Date</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b">
                      <td className="p-3">{record.attendanceDate}</td>
                      <td className="p-3">
                        {record.enrolment.course.code} —{" "}
                        {record.enrolment.course.name}
                      </td>
                      <td className="p-3">{record.status}</td>
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
