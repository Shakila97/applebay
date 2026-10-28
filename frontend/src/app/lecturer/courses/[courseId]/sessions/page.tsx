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
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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
    setError("");
    setMessage("");

    if (!sessionDate || !startTime || !endTime) {
      setError("Select the session date, start time and end time.");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be after start time on the same day.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch(
        `/api/lecturer/courses/${courseId}/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionDate,
            startTime,
            endTime,
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
          "Could not schedule the session. One may already exist on this date."
        );
      }

      if (response.status === 400) {
        throw new Error(
          "Choose a future start time and an end time after it. All times are Sri Lanka time."
        );
      }

      if (!response.ok) {
        throw new Error("Could not schedule the session.");
      }

      setSessionDate("");
      setStartTime("");
      setEndTime("");
      setMessage("Attendance session scheduled successfully.");
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

  function sessionLabel(session: AttendanceSession) {
    if (session.status === "CLOSED") return "Closed";

    const now = Date.now();

    if (now < new Date(session.opensAt).getTime()) {
      return "Scheduled";
    }

    if (now >= new Date(session.closesAt).getTime()) {
      return "Expired";
    }

    return "Open";
  }

  function formatSriLankaTime(value: string) {
    return new Date(value).toLocaleString("en-GB", {
      timeZone: "Asia/Colombo",
    });
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
        <h2 className="mb-2 text-xl font-semibold">
          Schedule attendance session
        </h2>

        <p className="mb-4 text-sm">
          All dates and times are Sri Lanka time.
        </p>

        <fieldset disabled={saving} className="space-y-4">
          <label className="block">
            Session date
            <input
              required
              type="date"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </label>

          <label className="block">
            Start time
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </label>

          <label className="block">
            End time
            <input
              required
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </label>

          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Scheduling..." : "Schedule session"}
          </button>
        </fieldset>

        <p className="mt-3 text-sm">
          One session per course per day. Start and end must be on the same day.
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
              <p>Status: {sessionLabel(session)}</p>
              <p>Opens: {formatSriLankaTime(session.opensAt)}</p>
              <p>Closes: {formatSriLankaTime(session.closesAt)}</p>

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
