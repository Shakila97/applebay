"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

type CsrfResponse = {
  token: string;
  headerName: string;
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Password must not exceed 72 UTF-8 bytes.");
      return;
    }

    setSaving(true);

    try {
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not connect to the signup service.");
      }

      const csrf: CsrfResponse = await csrfResponse.json();

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (response.status === 409) {
        throw new Error(
          "Account could not be created. This email may already be registered."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not create your account. Check your details and try again."
        );
      }

      setPassword("");
      setConfirmPassword("");
      setRegistered(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4 sm:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p className="text-center text-lg font-semibold">
          Applebay Institute
        </p>

        {registered ? (
          <Card>
            <CardHeader>
              <CardTitle>Account created</CardTitle>
              <CardDescription role="status">
                Log in to complete your student profile and receive your
                registration number.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className={cn(buttonVariants(), "w-full")}>
                Go to login
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create a Student account</CardTitle>
              <CardDescription>
                You will add your student details after logging in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="signup-form" onSubmit={handleSignup}>
                <FieldGroup>
                  {error && (
                    <Alert variant="destructive" aria-live="assertive">
                      <AlertCircleIcon />
                      <AlertTitle>Could not create account</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      required
                      type="email"
                      maxLength={150}
                      autoComplete="email"
                      autoCapitalize="none"
                      placeholder="you@example.com"
                      disabled={saving}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      required
                      type="password"
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      disabled={saving}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <FieldDescription>At least 8 characters.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      required
                      type="password"
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      disabled={saving}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                    />
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                form="signup-form"
                className="w-full"
                disabled={saving}
              >
                {saving && <Spinner data-icon="inline-start" />}
                {saving ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Log in
                </Link>
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}
