"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
  StatusBadge,
} from "@/components/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Attendance = {
  id: number;
  attendanceDate: string;
  status: "Present" | "Absent";
  enrolment: {
    course: {
      code: string;
      name: string;
    };
  };
};

type Summary = {
  present: number;
  total: number;
  percentage: number | null;
};

export default function MyAttendancePage() {
  const router = useRouter();

  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAttendance() {
      try {
        const responses = await Promise.all([
          fetch("/api/student/attendance", {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/student/attendance/summary", {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (responses.some((response) => response.status === 401)) {
          router.replace("/login");
          return;
        }

        if (responses.some((response) => response.status === 403)) {
          throw new Error("A Student account is required.");
        }

        if (responses.some((response) => response.status === 404)) {
          router.replace("/student/profile");
          return;
        }

        if (responses.some((response) => !response.ok)) {
          throw new Error("Could not load your attendance.");
        }

        const [recordData, summaryData] = await Promise.all(
          responses.map((response) => response.json())
        );

        setRecords(recordData);
        setSummary(summaryData);
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
  }, [router]);

  return (
    <PageShell>
      <PageHeader backHref="/student" title="My attendance" />

      {loading && <LoadingState label="Loading your attendance..." />}

      <ErrorAlert message={error} />

      {!loading && !error && summary && (
        <>
          <Card>
            <CardHeader>
              <CardDescription>Attendance percentage</CardDescription>
              <CardTitle className="text-3xl">
                {summary.percentage === null
                  ? "No records"
                  : `${summary.percentage}%`}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Present: {summary.present} / Recorded: {summary.total}
              </p>
              <p>Across all your courses. Unmarked dates are excluded.</p>
            </CardContent>
          </Card>

          {records.length === 0 ? (
            <EmptyState title="No attendance has been recorded yet" />
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.attendanceDate}</TableCell>
                        <TableCell>
                          {record.enrolment.course.code} —{" "}
                          {record.enrolment.course.name}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
