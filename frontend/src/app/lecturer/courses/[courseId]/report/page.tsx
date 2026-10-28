"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
    <main className="mx-auto max-w-6xl p-6">
      <Link href="/lecturer" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">
        Course attendance report
      </h1>

      {loading && <p role="status">Loading report...</p>}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && report && (
        <>
          <section className="mb-6 rounded border p-5">
            <h2 className="text-xl font-semibold">
              {report.courseName}
            </h2>

            <p className="mt-2">
              Enrolled students: {report.enrolledStudents}
            </p>

            <p className="mt-2 text-sm">
              Percentage is based on recorded attendance only.
              Unmarked dates are excluded.
            </p>
          </section>

          {report.students.length === 0 ? (
            <p>No students are enrolled in this course.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Reg. No.</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Present</th>
                    <th className="p-3">Recorded</th>
                    <th className="p-3">Percentage</th>
                  </tr>
                </thead>

                <tbody>
                  {report.students.map((student) => (
                    <tr key={student.studentId} className="border-b">
                      <td className="p-3">
                        {student.registrationNumber}
                      </td>

                      <td className="p-3">
                        {student.studentName}
                      </td>

                      <td className="p-3">{student.present}</td>
                      <td className="p-3">{student.total}</td>

                      <td className="p-3">
                        {student.percentage === null
                          ? "No records"
                          : `${student.percentage}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
