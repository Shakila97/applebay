"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-3xl font-bold">Log in</h1>

      <p className="mb-6">
        Use your email or student registration number.
      </p>

      <form
        onSubmit={handleLogin}
        className="rounded border p-5"
      >
        <fieldset disabled={loading} className="space-y-4">
          <label className="block">
            Email or registration number
            <input
              required
              type="text"
              name="identifier"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </label>

          <label className="block">
            Password
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 text-red-600">
            {error}
          </p>
        )}
      </form>

      <p className="mt-4">
        New student?{" "}
        <Link href="/signup" className="text-blue-600 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
