"use client";

import { useState } from "react";

type CsrfResponse = {
  token: string;
  headerName: string;
};

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not prepare logout. Please try again.");
      }

      const csrf: CsrfResponse = await csrfResponse.json();

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          [csrf.headerName]: csrf.token,
        },
      });

      if (!response.ok) {
        throw new Error("Could not log out. Please try again.");
      }

      // Reload the page to clear the previous account's frontend state.
      window.location.replace("/login");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={handleLogout}
        className="rounded border px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Logging out..." : "Log out"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
