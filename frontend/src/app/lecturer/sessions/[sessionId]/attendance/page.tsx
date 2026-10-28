"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/apiFetch";

type AttendanceStatus = "Present" | "Absent";

type AttendanceRow = {
  enrolmentId: number;
  studentName: string;
  nic: string;
  status: AttendanceStatus | "Unmarked";
};

export default function LecturerAttendancePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAttendance() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/lecturer/sessions/${sessionId}/attendance`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error("You are not assigned to this course.");
        }

        if (response.status === 404) {
          throw new Error("Attendance session not found.");
        }

        if (!response.ok) {
          throw new Error("Could not load attendance.");
        }

        const data: AttendanceRow[] = await response.json();

        if (!controller.signal.aborted) {
          setRows(data);
        }
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
  }, [sessionId, router]);

  async function markAttendance(
    enrolmentId: number,
    status: AttendanceStatus
  ) {
    setSavingId(enrolmentId);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/lecturer/sessions/${sessionId}/attendance/${enrolmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("You are not allowed to edit this attendance.");
      }

      if (!response.ok) {
        throw new Error("Could not save attendance.");
      }

      const updated: AttendanceRow = await response.json();

      setRows((current) =>
        current.map((row) =>
          row.enrolmentId === updated.enrolmentId ? updated : row
        )
      );

      setMessage(`Attendance saved for ${updated.studentName}.`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/lecturer" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">
        Student attendance
      </h1>

      <p className="mb-4">
        Each button saves immediately. You can correct marks after
        the session closes.
      </p>

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
        <p role="status">Loading students...</p>
      ) : rows.length === 0 && !error ? (
        <p>No students are enrolled in this course.</p>
      ) : (
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
              {rows.map((row) => (
                <tr key={row.enrolmentId} className="border-b">
                  <td className="p-3">{row.studentName}</td>
                  <td className="p-3">{row.nic}</td>
                  <td className="p-3">{row.status}</td>

                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingId !== null}
                        onClick={() =>
                          markAttendance(row.enrolmentId, "Present")
                        }
                        className="rounded bg-green-700 px-3 py-2 text-white disabled:opacity-50"
                      >
                        Present
                      </button>

                      <button
                        type="button"
                        disabled={savingId !== null}
                        onClick={() =>
                          markAttendance(row.enrolmentId, "Absent")
                        }
                        className="rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50"
                      >
                        Absent
                      </button>
                    </div>

                    {savingId === row.enrolmentId && (
                      <p role="status" className="mt-2 text-sm">
                        Saving...
                      </p>
                    )}
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
