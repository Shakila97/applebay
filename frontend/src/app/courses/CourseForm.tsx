"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

type Course = {
  id: number;
  code: string;
  name: string;
  level: string;
  duration: string;
};

type Props = {
  course?: Course | null;
  onSaved: () => void;
  onCancel: () => void;
};

export default function CourseForm({
  course,
  onSaved,
  onCancel,
}: Props) {
  const [code, setCode] = useState(course?.code ?? "");
  const [name, setName] = useState(course?.name ?? "");
  const [level, setLevel] = useState(course?.level ?? "HND");
  const [duration, setDuration] = useState(course?.duration ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        course ? `/api/courses/${course.id}` : "/api/courses",
        {
          method: course ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code.trim(),
            name: name.trim(),
            level,
            duration: duration.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not save. Check your values and use a unique course code."
        );
      }

      if (!course) {
        setCode("");
        setName("");
        setLevel("HND");
        setDuration("");
        setMessage("Course saved successfully.");
      }

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
      <h2 className="mb-4 text-xl font-semibold">
        {course ? "Edit course" : "Add course"}
      </h2>

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
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className={inputStyle}
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-white"
          >
            {saving
              ? "Saving..."
              : course
                ? "Update course"
                : "Save course"}
          </button>

          {course && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>
          )}
        </div>
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