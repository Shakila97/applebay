"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type CsrfResponse = {
  token: string;
  headerName: string;
};

type Account = {
  email: string;
  roles: string[];
};

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get a CSRF token and its associated session cookie.
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not connect to the login service.");
      }

      const csrf: CsrfResponse = await csrfResponse.json();

      const body = new URLSearchParams({
        identifier: identifier.trim(),
        password,
      });

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          [csrf.headerName]: csrf.token,
        },
        body,
      });

      if (loginResponse.status === 401) {
        throw new Error("Incorrect login details or account unavailable.");
      }

      if (!loginResponse.ok) {
        throw new Error("Login failed. Please try again.");
      }

      const accountResponse = await fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!accountResponse.ok) {
        throw new Error("Could not load your account. Please try logging in again.");
      }

      const account: Account = await accountResponse.json();

      setPassword("");

      if (account.roles.includes("ROLE_ADMIN")) {
        router.replace("/admin");
      } else if (account.roles.includes("ROLE_LECTURER")) {
        router.replace("/lecturer");
      } else if (account.roles.includes("ROLE_STUDENT")) {
        router.replace("/student");
      } else {
        throw new Error("Your account has no supported role.");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4 sm:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p className="text-center text-lg font-semibold">
          Applebay Institute
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>
              Use your email or student registration number.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="login-form" onSubmit={handleLogin} noValidate={false}>
              <FieldGroup>
                {error && (
                  <Alert variant="destructive" aria-live="assertive">
                    <AlertCircleIcon />
                    <AlertTitle>Could not log in</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="identifier">
                    Email or registration number
                  </FieldLabel>
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@example.com or STU-000001"
                    disabled={loading}
                    aria-invalid={error ? true : undefined}
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                  />
                  <FieldDescription>
                    Students can use the registration number shown on
                    their dashboard.
                  </FieldDescription>
                </Field>

                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    aria-invalid={error ? true : undefined}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              form="login-form"
              className="w-full"
              disabled={loading}
            >
              {loading && <Spinner data-icon="inline-start" />}
              {loading ? "Logging in..." : "Log in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New student?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
