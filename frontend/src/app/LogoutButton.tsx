"use client";

import { useState } from "react";
import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={handleLogout}
      >
        {loading ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <LogOutIcon data-icon="inline-start" />
        )}
        {loading ? "Logging out..." : "Log out"}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
