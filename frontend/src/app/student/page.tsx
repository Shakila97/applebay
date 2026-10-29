"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
} from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Profile = {
  name: string;
  registrationNumber: string;
};

export default function StudentDashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await fetch("/api/student/profile", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error("This dashboard requires a Student account.");
        }

        if (response.status === 404) {
          setNeedsProfile(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load your profile.");
        }

        setProfile(await response.json());
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

    loadDashboard();

    return () => controller.abort();
  }, [router]);

  return (
    <PageShell width="md">
      <PageHeader title="Student dashboard" />

      {loading && <LoadingState label="Loading your account..." rows={1} />}

      <ErrorAlert message={error} />

      {!loading && !error && needsProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Complete your registration</CardTitle>
            <CardDescription>
              Add your student details to receive your registration number.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/student/profile" className={buttonVariants()}>
              Complete profile
            </Link>
          </CardFooter>
        </Card>
      )}

      {!loading && !error && profile && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {profile.name}</CardTitle>
            <CardDescription>
              Registration number:{" "}
              <span className="font-mono font-medium text-foreground">
                {profile.registrationNumber}
              </span>
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Link href="/student/check-in" className={buttonVariants()}>
              Mark my attendance
            </Link>
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
              View my attendance
            </Link>
          </CardFooter>
        </Card>
      )}
    </PageShell>
  );
}
