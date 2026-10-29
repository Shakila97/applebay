"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
} from "@/components/page";
import { Badge } from "@/components/ui/badge";
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

type StudentReport = {
  studentId: number;
  registrationNumber: string;
  studentName: string;
  present: number;
  total: number;
  percentage: number | null;
};

type CourseReport = {
  courseId: number;
  courseName: string;
  enrolledStudents: number;
  students: StudentReport[];
};

export default function LecturerReportPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [report, setReport] = useState<CourseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/lecturer/courses/${courseId}/attendance-report`,
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
          throw new Error(
            "You are not allowed to view this course report."
          );
        }

        if (!response.ok) {
          throw new Error("Could not load the attendance report.");
        }

        const data: CourseReport = await response.json();

        if (!controller.signal.aborted) {
          setReport(data);
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

    loadReport();

    return () => controller.abort();
  }, [courseId, router]);

  return (
    <PageShell width="xl">
      <PageHeader backHref="/lecturer" title="Course attendance report" />

      {loading && <LoadingState label="Loading report..." />}

      <ErrorAlert message={error} />

      {!loading && !error && report && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{report.courseName}</CardTitle>
              <CardDescription>
                Enrolled students: {report.enrolledStudents}. Percentage is
                based on recorded attendance only; unmarked dates are
                excluded.
              </CardDescription>
            </CardHeader>
          </Card>

          {report.students.length === 0 ? (
            <EmptyState title="No students are enrolled in this course" />
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reg. No.</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Recorded</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.students.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="font-mono">
                          {student.registrationNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.studentName}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {student.present}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {student.total}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {student.percentage === null ? (
                            <Badge variant="outline">No records</Badge>
                          ) : (
                            `${student.percentage}%`
                          )}
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
