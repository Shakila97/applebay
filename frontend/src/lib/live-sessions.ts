"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/apiFetch";

export type SessionState = "SCHEDULED" | "ACTIVE" | "COMPLETED";

export type AttendanceMark = "Present" | "Absent";

export interface CourseInfo {
  id: number;
  code: string;
  name: string;
  level: string;
  duration: string;
}

export interface LiveSession {
  id: number;
  state: SessionState;
  opensAt: string;
  closesAt: string;
  myMark: AttendanceMark | null;
}

export interface CourseLive {
  course: CourseInfo;
  session: LiveSession | null;
}

interface LiveDashboardResponse {
  serverTime: string;
  courses: CourseLive[];
}

/** Everything a course card needs to render its attendance button. */
export type AttendanceStatus =
  | { kind: "none" }
  | { kind: "scheduled"; opensAt: string }
  | { kind: "active"; closesAt: string }
  | { kind: "marking" }
  | { kind: "marked" }
  | { kind: "absent" }
  | { kind: "ended" };

export interface LiveAlert {
  kind: "live" | "upcoming";
  course: CourseInfo;
  session: LiveSession;
  minutesUntilStart: number;
  marked: boolean;
}

/** An upcoming session is announced this many minutes before it opens. */
export const UPCOMING_WINDOW_MINUTES = 60;

const TICK_MS = 15_000;

/** Re-derives the state from the times, so cards flip on schedule between server updates. */
function effectiveState(session: LiveSession, now: number): SessionState {
  if (session.state === "COMPLETED") return "COMPLETED";
  if (now >= Date.parse(session.closesAt)) return "COMPLETED";
  if (now < Date.parse(session.opensAt)) return "SCHEDULED";
  return "ACTIVE";
}

export class LiveSessionError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

/**
 * Single source of truth for the student dashboard. The alert banner and
 * the course cards both read from it, so they can never disagree.
 *
 * Updates arrive three ways:
 * - SSE "session-changed" when a lecturer schedules, starts or closes a session
 * - a timer at the next opensAt/closesAt, for sessions that open or close on schedule
 * - a 15-second clock tick for countdown text
 */
export function useStudentLiveSessions() {
  const [courses, setCourses] = useState<CourseLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LiveSessionError | null>(null);
  const [actionError, setActionError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // serverTime - Date.now(), so a wrong local clock does not open the button early.
  const skew = useRef(0);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;

    try {
      const response = await fetch("/api/student/live", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new LiveSessionError(
          response.status === 404
            ? "Complete your student profile first."
            : "Could not load your courses.",
          response.status
        );
      }

      const data: LiveDashboardResponse = await response.json();

      // Ignore responses that arrive after a newer request.
      if (id !== requestId.current) return;

      skew.current = Date.parse(data.serverTime) - Date.now();
      setCourses(data.courses);
      setNow(Date.now() + skew.current);
      setError(null);
    } catch (caught) {
      if (id !== requestId.current) return;

      setError(
        caught instanceof LiveSessionError
          ? caught
          : new LiveSessionError("Could not load your courses.")
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Initial load + SSE subscription.
  useEffect(() => {
    // Deferred so the first fetch runs as a callback, not in the effect body.
    const initial = setTimeout(load, 0);

    const source = new EventSource("/api/student/live/events");

    // "connected" also fires after an automatic reconnect: resync anything missed.
    source.addEventListener("connected", () => {
      setConnected(true);
      load();
    });
    source.addEventListener("session-changed", () => load());
    source.onerror = () => setConnected(false);

    return () => {
      clearTimeout(initial);
      source.close();
    };
  }, [load]);

  // Clock tick for countdowns and on-schedule state changes.
  useEffect(() => {
    const timer = setInterval(
      () => setNow(Date.now() + skew.current),
      TICK_MS
    );
    return () => clearInterval(timer);
  }, []);

  // Refetch at the next boundary so the server confirms the new state.
  useEffect(() => {
    const boundaries = courses
      .flatMap(({ session }) => {
        if (!session) return [];
        const state = effectiveState(session, now);
        if (state === "SCHEDULED") return [Date.parse(session.opensAt)];
        if (state === "ACTIVE") return [Date.parse(session.closesAt)];
        return [];
      })
      .filter((time) => time > now);

    if (boundaries.length === 0) return;

    const delay = Math.min(Math.min(...boundaries) - now + 500, 2 ** 31 - 1);
    const timer = setTimeout(() => {
      setNow(Date.now() + skew.current);
      load();
    }, delay);

    return () => clearTimeout(timer);
  }, [courses, now, load]);

  const checkIn = useCallback(
    async (courseId: number) => {
      const entry = courses.find((item) => item.course.id === courseId);
      if (!entry?.session || markingId !== null) return;
      const session = entry.session;

      setMarkingId(session.id);
      setActionError("");

      try {
        const response = await apiFetch(
          `/api/student/attendance/sessions/${session.id}/check-in`,
          { method: "POST" }
        );

        if (response.ok) {
          setCourses((current) =>
            current.map((item) =>
              item.session?.id === session.id
                ? { ...item, session: { ...item.session, myMark: "Present" } }
                : item
            )
          );
          return;
        }

        if (response.status === 409) {
          setActionError(
            `${entry.course.name}: the session has ended or your attendance is already recorded.`
          );
          await load();
          return;
        }

        if (response.status === 401) {
          setActionError("Your session expired. Log in again.");
          return;
        }

        setActionError(`${entry.course.name}: could not mark attendance. Try again.`);
      } catch {
        setActionError("Could not reach the server. Check your connection.");
      } finally {
        setMarkingId(null);
      }
    },
    [courses, markingId, load]
  );

  const statusFor = useCallback(
    (item: CourseLive): AttendanceStatus => {
      const { session } = item;
      if (!session) return { kind: "none" };
      if (markingId === session.id) return { kind: "marking" };
      if (session.myMark === "Present") return { kind: "marked" };
      if (session.myMark === "Absent") return { kind: "absent" };

      const state = effectiveState(session, now);
      if (state === "SCHEDULED") return { kind: "scheduled", opensAt: session.opensAt };
      if (state === "ACTIVE") return { kind: "active", closesAt: session.closesAt };
      return { kind: "ended" };
    },
    [markingId, now]
  );

  const alerts = useMemo<LiveAlert[]>(
    () =>
      courses
        .flatMap(({ course, session }): LiveAlert[] => {
          if (!session) return [];

          const state = effectiveState(session, now);
          const minutesUntilStart = Math.ceil(
            (Date.parse(session.opensAt) - now) / 60_000
          );
          const marked = session.myMark !== null;

          if (state === "ACTIVE") {
            return [{ kind: "live", course, session, minutesUntilStart: 0, marked }];
          }

          if (state === "SCHEDULED" && minutesUntilStart <= UPCOMING_WINDOW_MINUTES) {
            return [{ kind: "upcoming", course, session, minutesUntilStart, marked }];
          }

          return [];
        })
        // Live first, then soonest upcoming.
        .sort((a, b) =>
          a.kind === b.kind
            ? a.minutesUntilStart - b.minutesUntilStart
            : a.kind === "live"
              ? -1
              : 1
        ),
    [courses, now]
  );

  return {
    courses,
    alerts,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(""),
    connected,
    markingId,
    statusFor,
    checkIn,
    reload: load,
  };
}

export function formatSriLankaTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
  });
}
