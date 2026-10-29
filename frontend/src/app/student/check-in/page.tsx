"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/apiFetch";

import { RefreshCwIcon } from "lucide-react";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
  StatusBadge,
  SuccessAlert,
} from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

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
    <PageShell>
      <PageHeader
        backHref="/student"
        title="Attendance check-in"
        description="Open sessions for the courses you are enrolled in."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading || savingId !== null}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh sessions
          </Button>
        }
      />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      {loading ? (
        <LoadingState label="Loading open sessions..." rows={2} />
      ) : sessions.length === 0 && !error ? (
        <EmptyState
          title="No open attendance sessions"
          description="Sessions appear here while your lecturer has check-in open."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sessions.map((session) => (
            <Card key={session.sessionId}>
              <CardHeader>
                <CardTitle>{session.courseName}</CardTitle>
                <CardDescription>
                  {session.sessionDate} · Closes{" "}
                  {new Date(session.closesAt).toLocaleString()}
                </CardDescription>
                <CardAction>
                  <StatusBadge status={session.attendanceStatus} />
                </CardAction>
              </CardHeader>

              {session.attendanceStatus === "Unmarked" && (
                <CardFooter>
                  <Button
                    type="button"
                    disabled={savingId !== null}
                    onClick={() => checkIn(session.sessionId)}
                  >
                    {savingId === session.sessionId && (
                      <Spinner data-icon="inline-start" />
                    )}
                    {savingId === session.sessionId
                      ? "Saving..."
                      : "Mark my attendance"}
                  </Button>
                </CardFooter>
              )}

              {session.attendanceStatus === "Absent" && (
                <CardContent className="text-sm text-muted-foreground">
                  Contact your lecturer if this mark needs correcting.
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
