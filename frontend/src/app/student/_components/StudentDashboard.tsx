"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
} from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useStudentLiveSessions } from "@/lib/live-sessions";

import { CourseCard } from "./CourseCard";
import { LiveSessionAlert } from "./LiveSessionAlert";

export interface StudentProfile {
  name: string;
  registrationNumber: string;
}

export function StudentDashboard({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const live = useStudentLiveSessions();

  useEffect(() => {
    if (live.error?.status === 401) router.replace("/login");
  }, [live.error, router]);

  return (
    <PageShell width="xl">
      <LiveSessionAlert
        alerts={live.alerts}
        markingId={live.markingId}
        onMarkAttendance={live.checkIn}
      />

      <PageHeader
        title={`Welcome, ${profile.name}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Registration number
            <Badge variant="outline" className="font-mono">
              {profile.registrationNumber}
            </Badge>
            {!live.loading && (
              <Badge variant={live.connected ? "secondary" : "outline"}>
                {live.connected ? "Live updates on" : "Reconnecting..."}
              </Badge>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/student/courses"
              className={buttonVariants({ variant: "outline" })}
            >
              Browse courses
            </Link>
            <Link
              href="/student/attendance"
              className={buttonVariants({ variant: "outline" })}
            >
              My attendance
            </Link>
          </div>
        }
      />

      <ErrorAlert
        title="Attendance not marked"
        message={live.actionError}
      />

      {live.loading && <LoadingState label="Loading your courses..." />}

      {!live.loading && live.error && live.error.status !== 401 && (
        <ErrorAlert message={live.error.message} />
      )}

      {!live.loading && !live.error && live.courses.length === 0 && (
        <EmptyState
          title="No enrolled courses"
          description="Enrol in a course to see its sessions here."
        >
          <Link href="/student/courses" className={buttonVariants()}>
            Browse courses
          </Link>
        </EmptyState>
      )}

      {!live.loading && live.courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.courses.map((item) => (
            <CourseCard
              key={item.course.id}
              course={item.course}
              status={live.statusFor(item)}
              busy={live.markingId !== null}
              onMarkAttendance={live.checkIn}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
