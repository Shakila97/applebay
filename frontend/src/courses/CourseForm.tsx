"use client";

import { useState, type FormEvent } from "react";

type Props = {
  onSaved: () => void;
};

export default function CourseForm({ onSaved }: Props) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("HND");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          level,
          duration: duration.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Could not save. Check your values and use a unique course code."
        );
      }

      setCode("");
      setName("");
      setLevel("HND");
      setDuration("");
      setMessage("Course saved successfully.");
      onSaved();
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
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded border p-5"
    >
      <h2 className="mb-4 text-xl font-semibold">Add course</h2>

      <fieldset disabled={saving} className="space-y-4">
        <label className="block">
          Course code
          <input
            required
            maxLength={30}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={inputStyle}
          />
        </label>

        <label className="block">
          Course name
          <input
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputStyle}
          />
        </label>

        <label className="block">
          Level
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className={inputStyle}
          >
            <option value="HND">HND</option>
            <option value="Certificate">Certificate</option>
          </select>
        </label>

        <label className="block">
          Duration
          <input
            required
            maxLength={60}
            placeholder="6 months"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className={inputStyle}
          />
        </label>

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save course"}
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="mt-3 text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-3 text-green-700">
          {message}
        </p>
      )}
    </form>
    
  );
}
