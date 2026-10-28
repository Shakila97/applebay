"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/apiFetch";

type Lesson = {
  id: number;
  title: string;
  body: string;
  updatedAt: string;
};

export default function AdminContentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLessons() {
      setLoading(true);
      setReady(false);
      setError("");
      setMessage("");
      setEditingId(null);
      setTitle("");
      setBody("");

      try {
        const response = await fetch(
          `/api/admin/courses/${courseId}/contents`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error("Administrator access is required.");
        }

        if (!response.ok) {
          throw new Error("Could not load course content.");
        }

        const data: Lesson[] = await response.json();

        if (!controller.signal.aborted) {
          setLessons(data);
          setReady(true);
        }
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

    loadLessons();

    return () => controller.abort();
  }, [courseId, router]);

  function clearForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
  }

  function editLesson(lesson: Lesson) {
    setEditingId(lesson.id);
    setTitle(lesson.title);
    setBody(lesson.body);
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!title.trim() || !body.trim()) {
      setError("Title and lesson content are required.");
      return;
    }

    setSaving(true);

    try {
      const url = editingId === null
        ? `/api/admin/courses/${courseId}/contents`
        : `/api/admin/courses/${courseId}/contents/${editingId}`;

      const response = await apiFetch(url, {
        method: editingId === null ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("Administrator access is required.");
      }

      if (!response.ok) {
        throw new Error("Could not save the lesson.");
      }

      const saved: Lesson = await response.json();

      setLessons((current) =>
        editingId === null
          ? [...current, saved]
          : current.map((lesson) =>
              lesson.id === saved.id ? saved : lesson
            )
      );

      clearForm();
      setMessage("Lesson saved successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteLesson(id: number) {
    if (!window.confirm("Delete this lesson permanently?")) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/admin/courses/${courseId}/contents/${id}`,
        { method: "DELETE" }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("Administrator access is required.");
      }

      if (!response.ok) {
        throw new Error("Could not delete the lesson.");
      }

      setLessons((current) =>
        current.filter((lesson) => lesson.id !== id)
      );

      if (editingId === id) {
        clearForm();
      }

      setMessage("Lesson deleted successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/admin" className="text-blue-600 underline">
        Back to dashboard
      </Link>

      <h1 className="my-6 text-3xl font-bold">Course content</h1>

      {error && (
        <p role="alert" className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-4 text-green-700">
          {message}
        </p>
      )}

      {loading && <p role="status">Loading lessons...</p>}

      {!loading && ready && (
        <>
          <form
            onSubmit={saveLesson}
            className="mb-8 rounded border p-5"
          >
            <h2 className="mb-4 text-xl font-semibold">
              {editingId === null ? "Add lesson" : "Edit lesson"}
            </h2>

            <fieldset disabled={saving} className="space-y-4">
              <label className="block">
                Lesson title
                <input
                  required
                  maxLength={150}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>

              <label className="block">
                Lesson content
                <textarea
                  required
                  maxLength={100000}
                  rows={10}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-blue-700 px-4 py-2 text-white"
                >
                  {saving
                    ? "Saving..."
                    : editingId === null
                      ? "Add lesson"
                      : "Update lesson"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={clearForm}
                    className="rounded border px-4 py-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </fieldset>
          </form>

          <h2 className="mb-4 text-xl font-semibold">Saved lessons</h2>

          {lessons.length === 0 ? (
            <p>No lessons added yet.</p>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <section key={lesson.id} className="rounded border p-5">
                  <h3 className="text-xl font-semibold">
                    {lesson.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap break-words">
                    {lesson.body}
                  </p>

                  <p className="mt-4 text-sm">
                    Updated: {new Date(lesson.updatedAt).toLocaleString()}
                  </p>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => editLesson(lesson)}
                    className="mt-4 rounded border px-4 py-2 disabled:opacity-50"
                  >
                    Edit lesson
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => deleteLesson(lesson.id)}
                    className="ml-3 mt-4 rounded bg-red-700 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Delete lesson
                  </button>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
