"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttendanceStatus = "Present" | "Absent";

type AttendanceRow = {
  enrolmentId: number;
  studentName: string;
  nic: string;
  status: AttendanceStatus | "Unmarked";
};

export default function LecturerAttendancePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAttendance() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/lecturer/sessions/${sessionId}/attendance`,
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
          throw new Error("You are not assigned to this course.");
        }

        if (response.status === 404) {
          throw new Error("Attendance session not found.");
        }

        if (!response.ok) {
          throw new Error("Could not load attendance.");
        }

        const data: AttendanceRow[] = await response.json();

        if (!controller.signal.aborted) {
          setRows(data);
        }
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
  }, [sessionId, router]);

  async function markAttendance(
    enrolmentId: number,
    status: AttendanceStatus
  ) {
    setSavingId(enrolmentId);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/lecturer/sessions/${sessionId}/attendance/${enrolmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("You are not allowed to edit this attendance.");
      }

      if (!response.ok) {
        throw new Error("Could not save attendance.");
      }

      const updated: AttendanceRow = await response.json();

      setRows((current) =>
        current.map((row) =>
          row.enrolmentId === updated.enrolmentId ? updated : row
        )
      );

      setMessage(`Attendance saved for ${updated.studentName}.`);
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
        backHref="/lecturer"
        title="Student attendance"
        description="Each button saves immediately. You can correct marks after the session closes."
      />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      {loading ? (
        <LoadingState label="Loading students..." />
      ) : rows.length === 0 && !error ? (
        <EmptyState title="No students are enrolled in this course" />
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Saved status</TableHead>
                  <TableHead className="text-right">Mark attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.enrolmentId}>
                    <TableCell className="font-medium">
                      {row.studentName}
                    </TableCell>
                    <TableCell className="font-mono">{row.nic}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {savingId === row.enrolmentId && (
                          <Spinner aria-label="Saving" />
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            row.status === "Present" ? "default" : "outline"
                          }
                          disabled={savingId !== null}
                          onClick={() =>
                            markAttendance(row.enrolmentId, "Present")
                          }
                        >
                          Present
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            row.status === "Absent" ? "destructive" : "outline"
                          }
                          disabled={savingId !== null}
                          onClick={() =>
                            markAttendance(row.enrolmentId, "Absent")
                          }
                        >
                          Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
