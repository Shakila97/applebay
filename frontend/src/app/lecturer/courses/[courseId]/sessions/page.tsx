"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/apiFetch";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
  StatusBadge,
  SuccessAlert,
} from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

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
  const [now, setNow] = useState(() => Date.now());

  // Re-evaluate Open / Expired labels as time passes.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

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
    <PageShell>
      <PageHeader backHref="/lecturer" title="Attendance sessions" />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      <Card>
        <CardHeader>
          <CardTitle>Schedule attendance session</CardTitle>
          <CardDescription>
            All dates and times are Sri Lanka time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="session-form" onSubmit={openSession}>
            <FieldGroup className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="session-date">Session date</FieldLabel>
                <Input
                  id="session-date"
                  required
                  type="date"
                  disabled={saving}
                  value={sessionDate}
                  onChange={(event) => setSessionDate(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="start-time">Start time</FieldLabel>
                <Input
                  id="start-time"
                  required
                  type="time"
                  disabled={saving}
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="end-time">End time</FieldLabel>
                <Input
                  id="end-time"
                  required
                  type="time"
                  disabled={saving}
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            One session per course per day. Start and end must be on the same
            day.
          </p>
          <Button type="submit" form="session-form" disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            {saving ? "Scheduling..." : "Schedule session"}
          </Button>
        </CardFooter>
      </Card>

      <h2 className="text-lg font-semibold">Saved sessions</h2>

      {loading ? (
        <LoadingState label="Loading sessions..." rows={2} />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Schedule a session above to start taking attendance."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle>{session.sessionDate}</CardTitle>
                <CardDescription>{session.courseName}</CardDescription>
                <CardAction>
                  <StatusBadge status={sessionLabel(session)} />
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Opens: {formatSriLankaTime(session.opensAt)}</p>
                <p>Closes: {formatSriLankaTime(session.closesAt)}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Link
                  href={`/lecturer/sessions/${session.id}/attendance`}
                  className={buttonVariants()}
                >
                  View and mark students
                </Link>
                {session.status === "OPEN" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => closeSession(session.id)}
                  >
                    Close session
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
