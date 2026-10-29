"use client";

import Link from "next/link";
import {
  BookOpenIcon,
  CheckIcon,
  ClockIcon,
  RadioIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  formatSriLankaTime,
  type AttendanceStatus,
  type CourseInfo,
} from "@/lib/live-sessions";

interface CourseCardProps {
  course: CourseInfo;
  status: AttendanceStatus;
  /** True while any check-in is in flight, so a second card can't fire at once. */
  busy: boolean;
  onMarkAttendance: (courseId: number) => void;
}

export function CourseCard({
  course,
  status,
  busy,
  onMarkAttendance,
}: CourseCardProps) {
  const live = status.kind === "active" || status.kind === "marking";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{course.code}</Badge>
          {live && (
            <Badge variant="destructive">
              <RadioIcon data-icon="inline-start" />
              Live
            </Badge>
          )}
        </div>
        <CardTitle className="font-bold">{course.name}</CardTitle>
        <CardDescription>
          {course.level} · {course.duration}
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto flex flex-col items-stretch gap-2">
        <div aria-live="polite" className="flex flex-col gap-1">
          <AttendanceControl
            courseId={course.id}
            courseName={course.name}
            status={status}
            busy={busy}
            onMarkAttendance={onMarkAttendance}
          />
        </div>

        <Link
          href={`/student/courses/${course.id}/contents`}
          className={buttonVariants({ variant: "ghost" })}
        >
          <BookOpenIcon data-icon="inline-start" />
          Lessons
        </Link>
      </CardFooter>
    </Card>
  );
}

function AttendanceControl({
  courseId,
  courseName,
  status,
  busy,
  onMarkAttendance,
}: {
  courseId: number;
  courseName: string;
  status: AttendanceStatus;
  busy: boolean;
  onMarkAttendance: (courseId: number) => void;
}) {
  switch (status.kind) {
    case "active":
      return (
        <>
          <Button
            disabled={busy}
            onClick={() => onMarkAttendance(courseId)}
            aria-label={`Mark attendance for ${courseName}`}
          >
            <CheckIcon data-icon="inline-start" />
            Mark attendance
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Closes at {formatSriLankaTime(status.closesAt)}
          </p>
        </>
      );

    case "marking":
      return (
        <Button disabled>
          <Spinner data-icon="inline-start" />
          Marking...
        </Button>
      );

    case "marked":
      return (
        <Badge variant="secondary" className="h-9 w-full justify-center">
          <CheckIcon data-icon="inline-start" />
          Attendance marked ✓
        </Badge>
      );

    case "absent":
      return (
        <Badge variant="outline" className="h-9 w-full justify-center">
          Marked absent by your lecturer
        </Badge>
      );

    case "ended":
      return (
        <Badge variant="outline" className="h-9 w-full justify-center">
          Session ended
        </Badge>
      );

    case "scheduled":
      return (
        <Button variant="outline" disabled>
          <ClockIcon data-icon="inline-start" />
          Starts at {formatSriLankaTime(status.opensAt)}
        </Button>
      );

    case "none":
      return (
        <Button variant="outline" disabled>
          No active session
        </Button>
      );
  }
}
