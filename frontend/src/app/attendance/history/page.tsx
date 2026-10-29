"use client";

import { useEffect, useState, type FormEvent } from "react";

import { OptionSelect } from "@/components/option-select";
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
  StatusBadge,
} from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Student = {
  id: number;
  name: string;
  nic: string;
};

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

export default function AttendanceHistoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      try {
        const response = await fetch("/api/students", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load students.");
        }

        setStudents(await response.json());
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStudents(false);
        }
      }
    }

    loadStudents();

    return () => controller.abort();
  }, []);

  async function loadHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSummary(null);
    setRecords([]);

    try {
      const [recordsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/attendance/students/${studentId}`, {
          cache: "no-store",
        }),
        fetch(`/api/attendance/students/${studentId}/summary`, {
          cache: "no-store",
        }),
      ]);

      if (!recordsResponse.ok || !summaryResponse.ok) {
        throw new Error("Could not load attendance history.");
      }

      const recordData: Attendance[] = await recordsResponse.json();
      const summaryData: Summary = await summaryResponse.json();

      setRecords(recordData);
      setSummary(summaryData);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader title="Student attendance history" />

      <ErrorAlert message={error} />

      {loadingStudents ? (
        <LoadingState label="Loading students..." rows={1} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose a student</CardTitle>
            {students.length === 0 && (
              <CardDescription>Register a student first.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form id="history-form" onSubmit={loadHistory}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="history-student">Student</FieldLabel>
                  <OptionSelect
                    id="history-student"
                    required
                    placeholder="Choose a student"
                    disabled={loading || students.length === 0}
                    value={studentId}
                    onChange={(value) => {
                      setStudentId(value);
                      setSummary(null);
                      setRecords([]);
                      setError("");
                    }}
                    options={students.map((student) => ({
                      value: String(student.id),
                      label: `${student.name} — ${student.nic}`,
                    }))}
                  />
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              form="history-form"
              disabled={loading || students.length === 0 || !studentId}
            >
              {loading && <Spinner data-icon="inline-start" />}
              {loading ? "Loading..." : "View attendance"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {summary && (
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
              <p>
                Calculated across all courses. Unmarked dates are excluded.
              </p>
            </CardContent>
          </Card>

          {records.length === 0 ? (
            <EmptyState title="No attendance records found" />
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
