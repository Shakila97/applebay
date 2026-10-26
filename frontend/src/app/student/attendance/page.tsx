"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function MyAttendancePage() {
  const router = useRouter();

  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAttendance() {
      try {
        const responses = await Promise.all([
          fetch("/api/student/attendance", {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/student/attendance/summary", {
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
          router.replace("/student/profile");
          return;
        }

        if (responses.some((response) => !response.ok)) {
          throw new Error("Could not load your attendance.");
        }

        const [recordData, summaryData] = await Promise.all(
          responses.map((response) => response.json())
        );

        setRecords(recordData);
        setSummary(summaryData);
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

    loadAttendance();

    return () => controller.abort();
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/student" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">My attendance</h1>

      {loading && <p role="status">Loading your attendance...</p>}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && summary && (
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
              Across all your courses. Unmarked dates are excluded.
            </p>
          </section>

          {records.length === 0 ? (
            <p>No attendance has been recorded yet.</p>
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
                      <td className="p-3">
                        {record.attendanceDate}
                      </td>

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
