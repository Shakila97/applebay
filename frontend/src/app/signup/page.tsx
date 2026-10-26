"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

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

  const inputStyle = "mt-1 w-full rounded border p-2";

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-3 text-3xl font-bold">
        Create a Student account
      </h1>

      {registered ? (
        <section className="rounded border p-5">
          <p role="status" className="mb-4 text-green-700">
            Account created successfully. Log in to complete your
            student profile and receive your registration number.
          </p>

          <Link
            href="/login"
            className="inline-block rounded bg-blue-700 px-4 py-2 text-white"
          >
            Go to login
          </Link>
        </section>
      ) : (
        <form
          onSubmit={handleSignup}
          className="rounded border p-5"
        >
          <fieldset disabled={saving} className="space-y-4">
            <label className="block">
              Email
              <input
                required
                type="email"
                maxLength={150}
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputStyle}
              />
            </label>

            <label className="block">
              Password
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputStyle}
              />
            </label>

            <label className="block">
              Confirm password
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                className={inputStyle}
              />
            </label>

            <button
              type="submit"
              className="w-full rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Creating account..." : "Create account"}
            </button>
          </fieldset>

          {error && (
            <p role="alert" className="mt-4 text-red-600">
              {error}
            </p>
          )}

          <p className="mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
