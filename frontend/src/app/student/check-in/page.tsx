"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/apiFetch";

type OpenSession = {
  sessionId: number;
  courseId: number;
  courseName: string;
  sessionDate: string;
  closesAt: string;
  attendanceStatus: "Unmarked" | "Present" | "Absent";
};

type CheckInResponse = {
  attendanceId: number;
  date: string;
  status: "Present";
  alreadyMarked: boolean;
};

export default function StudentCheckInPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<OpenSession[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/student/attendance/sessions",
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
          throw new Error("A Student account is required.");
        }

        if (response.status === 404) {
          throw new Error(
            "Could not load sessions. Complete your student profile first."
          );
        }

        if (!response.ok) {
          throw new Error("Could not load attendance sessions.");
        }

        const data: OpenSession[] = await response.json();

        if (!controller.signal.aborted) {
          setSessions(data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSessions();

    return () => controller.abort();
  }, [refreshKey, router]);

  async function checkIn(sessionId: number) {
    setSavingId(sessionId);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/student/attendance/sessions/${sessionId}/check-in`,
        { method: "POST" }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not allowed to check in to this course."
        );
      }

      if (response.status === 409) {
        throw new Error(
          "Check-in could not be completed. The session may be closed or your attendance may already be marked Absent."
        );
      }

      if (!response.ok) {
        throw new Error("Could not save your attendance.");
      }

      const result: CheckInResponse = await response.json();

      setMessage(
        result.alreadyMarked
          ? "You were already marked Present."
          : "Your attendance was marked Present."
      );

      setRefreshKey((value) => value + 1);
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
      <Link href="/student" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">
        Attendance check-in
      </h1>

      <button
        type="button"
        onClick={() => setRefreshKey((value) => value + 1)}
        disabled={loading || savingId !== null}
        className="mb-6 rounded border px-4 py-2 disabled:opacity-50"
      >
        Refresh sessions
      </button>

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
        <p role="status">Loading open sessions...</p>
      ) : sessions.length === 0 && !error ? (
        <p>No open attendance sessions are available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sessions.map((session) => (
            <section
              key={session.sessionId}
              className="rounded border p-5"
            >
              <h2 className="text-xl font-semibold">
                {session.courseName}
              </h2>

              <p className="mt-3">Date: {session.sessionDate}</p>

              <p>
                Closes: {new Date(session.closesAt).toLocaleString()}
              </p>

              <p className="mt-2">
                Attendance: {session.attendanceStatus}
              </p>

              {session.attendanceStatus === "Unmarked" && (
                <button
                  type="button"
                  disabled={savingId !== null}
                  onClick={() => checkIn(session.sessionId)}
                  className="mt-4 rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
                >
                  {savingId === session.sessionId
                    ? "Saving..."
                    : "Mark my attendance"}
                </button>
              )}

              {session.attendanceStatus === "Absent" && (
                <p className="mt-3 text-sm">
                  Contact your lecturer if this mark needs correcting.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
