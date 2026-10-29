"use client";

import { CheckIcon, ClockIcon } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatSriLankaTime, type LiveAlert } from "@/lib/live-sessions";

interface LiveSessionAlertProps {
  alerts: LiveAlert[];
  markingId: number | null;
  onMarkAttendance: (courseId: number) => void;
}

/** Stacked banner: live sessions first, then sessions starting within the hour. */
export function LiveSessionAlert({
  alerts,
  markingId,
  onMarkAttendance,
}: LiveSessionAlertProps) {
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label="Live and upcoming sessions"
      className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
    >
      {alerts.map((alert) =>
        alert.kind === "live" ? (
          <LiveAlertRow
            key={alert.session.id}
            alert={alert}
            marking={markingId === alert.session.id}
            busy={markingId !== null}
            onMarkAttendance={onMarkAttendance}
          />
        ) : (
          <Alert key={alert.session.id} role="status">
            <ClockIcon />
            <AlertTitle>Upcoming: {alert.course.name}</AlertTitle>
            <AlertDescription>
              Starts in {alert.minutesUntilStart}{" "}
              {alert.minutesUntilStart === 1 ? "minute" : "minutes"} at{" "}
              {formatSriLankaTime(alert.session.opensAt)}.
            </AlertDescription>
          </Alert>
        )
      )}
    </section>
  );
}

function LiveAlertRow({
  alert,
  marking,
  busy,
  onMarkAttendance,
}: {
  alert: LiveAlert;
  marking: boolean;
  busy: boolean;
  onMarkAttendance: (courseId: number) => void;
}) {
  return (
    <Alert variant="destructive" role="alert">
      <span className="relative mt-1 flex size-2.5" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
      </span>
      <AlertTitle>LIVE NOW: {alert.course.name}</AlertTitle>
      <AlertDescription>
        {alert.marked
          ? "Your attendance is recorded for this session."
          : `Mark attendance before ${formatSriLankaTime(alert.session.closesAt)}.`}
      </AlertDescription>
      <AlertAction>
        {alert.marked ? (
          <Badge variant="secondary">
            <CheckIcon data-icon="inline-start" />
            Marked
          </Badge>
        ) : (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onMarkAttendance(alert.course.id)}
          >
            {marking && <Spinner data-icon="inline-start" />}
            {marking ? "Marking..." : "Mark attendance"}
          </Button>
        )}
      </AlertAction>
    </Alert>
  );
}
