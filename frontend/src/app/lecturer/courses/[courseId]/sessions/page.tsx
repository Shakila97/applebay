"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/apiFetch";

type AttendanceSession = {
  id: number;
  courseId: number;
  courseName: string;
  sessionDate: string;
  opensAt: string;
  closesAt: string;
  status: "OPEN" | "CLOSED";
};

export default function LecturerSessionsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [duration, setDuration] = useState("15");
  const [refreshKey, setRefreshKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/lecturer/courses/${courseId}/sessions`,
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
          throw new Error("You are not allowed to view this course.");
        }

        if (!response.ok) {
          throw new Error("Could not load attendance sessions.");
        }

        const data: AttendanceSession[] = await response.json();

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
  }, [courseId, refreshKey, router]);

  async function openSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/lecturer/courses/${courseId}/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            durationMinutes: Number(duration),
          }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("You are not assigned to this course.");
      }

      if (response.status === 409) {
        throw new Error(
          "Could not create the session. One may already exist for this course today."
        );
      }

      if (!response.ok) {
        throw new Error("Could not open the session.");
      }

      setMessage("Attendance session opened.");
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function closeSession(sessionId: number) {
    if (!window.confirm("Close this attendance session?")) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/lecturer/sessions/${sessionId}/close`,
        { method: "PUT" }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("You are not allowed to close this session.");
      }

      if (!response.ok) {
        throw new Error("Could not close the session.");
      }

      setMessage("Attendance session closed.");
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/lecturer" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">
        Attendance sessions
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

      <form
        onSubmit={openSession}
        className="mb-8 rounded border p-5"
      >
        <h2 className="mb-4 text-xl font-semibold">
          Open today’s session
        </h2>

        <label className="block">
          Check-in duration in minutes
          <input
            required
            type="number"
            min="1"
            max="240"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            disabled={saving}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Open session"}
        </button>

        <p className="mt-3 text-sm">
          One session can be created per course per day.
        </p>
      </form>

      <h2 className="mb-4 text-xl font-semibold">
        Saved sessions
      </h2>

      {loading ? (
        <p role="status">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p>No sessions have been created for this course.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <section key={session.id} className="rounded border p-5">
              <h3 className="font-semibold">{session.courseName}</h3>

              <p>Date: {session.sessionDate}</p>
              <p>Status: {session.status}</p>

              <p>
                Opens: {new Date(session.opensAt).toLocaleString()}
              </p>

              <p>
                Closes: {new Date(session.closesAt).toLocaleString()}
              </p>

              <Link
                href={`/lecturer/sessions/${session.id}/attendance`}
                className="mt-4 mr-3 inline-block rounded bg-blue-700 px-4 py-2 text-white"
              >
                View and mark students
              </Link>

              {session.status === "OPEN" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => closeSession(session.id)}
                  className="mt-4 rounded border px-4 py-2 disabled:opacity-50"
                >
                  Close session
                </button>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
