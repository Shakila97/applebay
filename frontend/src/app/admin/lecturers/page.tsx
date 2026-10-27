"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
};

type LecturerResponse = {
  id: number;
  name: string;
  phone: string;
  email: string;
};

export default function LecturersPage() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedLecturer, setSavedLecturer] =
    useState<LecturerResponse | null>(null);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSavedLecturer(null);

    if (new TextEncoder().encode(form.password).length > 72) {
      setError("Password must not exceed 72 UTF-8 bytes.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch("/api/admin/lecturers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("Administrator access is required.");
      }

      if (response.status === 409) {
        throw new Error(
          "Could not create the lecturer. The email may already be registered."
        );
      }

      if (!response.ok) {
        throw new Error("Could not save. Check the details and try again.");
      }

      const lecturer: LecturerResponse = await response.json();

      setSavedLecturer(lecturer);
      setForm(emptyForm);
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
    <main className="mx-auto max-w-xl p-6">
      <Link href="/admin" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">
        Register lecturer
      </h1>

      {error && (
        <p role="alert" className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {savedLecturer && (
        <div role="status" className="mb-4 rounded border p-4 text-green-700">
          Lecturer registered: {savedLecturer.name} — {savedLecturer.email}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded border p-5">
        <fieldset disabled={saving} className="space-y-4">
          <label className="block">
            Name
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputStyle}
            />
          </label>

          <label className="block">
            Phone
            <input
              required
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={inputStyle}
            />
          </label>

          <label className="block">
            Email
            <input
              required
              type="email"
              maxLength={150}
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputStyle}
            />
          </label>

          <label className="block">
            Initial password
            <input
              required
              type="password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) =>
                updateField("password", event.target.value)
              }
              className={inputStyle}
            />
          </label>

          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Register lecturer"}
          </button>
        </fieldset>
      </form>
    </main>
  );
}
