"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/apiFetch";

import { LessonEditor } from "@/components/lesson-editor";
import {
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
  SuccessAlert,
} from "@/components/page";

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
    <PageShell width="md">
      <PageHeader backHref="/admin" title="Course content" />

      <ErrorAlert message={error} />
      <SuccessAlert message={message} />

      {loading && <LoadingState label="Loading lessons..." />}

      {!loading && ready && (
        <LessonEditor
          lessons={lessons}
          editingId={editingId}
          title={title}
          body={body}
          saving={saving}
          onTitleChange={setTitle}
          onBodyChange={setBody}
          onSubmit={saveLesson}
          onCancel={clearForm}
          onEdit={editLesson}
          onDelete={deleteLesson}
        />
      )}
    </PageShell>
  );
}
