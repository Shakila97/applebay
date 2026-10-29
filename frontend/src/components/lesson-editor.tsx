"use client";

import type { FormEvent } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { EmptyState } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type Lesson = {
  id: number;
  title: string;
  body: string;
  updatedAt: string;
};

// Add/edit form plus the saved lesson list, shared by the admin and
// lecturer course content pages. All state lives in the page.
export function LessonEditor({
  lessons,
  editingId,
  title,
  body,
  saving,
  onTitleChange,
  onBodyChange,
  onSubmit,
  onCancel,
  onEdit,
  onDelete,
}: {
  lessons: Lesson[];
  editingId: number | null;
  title: string;
  body: string;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onEdit: (lesson: Lesson) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId === null ? "Add lesson" : "Edit lesson"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="lesson-form" onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="lesson-title">Lesson title</FieldLabel>
                <Input
                  id="lesson-title"
                  required
                  maxLength={150}
                  disabled={saving}
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lesson-body">Lesson content</FieldLabel>
                <Textarea
                  id="lesson-body"
                  required
                  maxLength={100000}
                  rows={10}
                  disabled={saving}
                  value={body}
                  onChange={(event) => onBodyChange(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="submit" form="lesson-form" disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            {saving
              ? "Saving..."
              : editingId === null
                ? "Add lesson"
                : "Update lesson"}
          </Button>
          {editingId !== null && (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      </Card>

      <h2 className="text-lg font-semibold">Saved lessons</h2>

      {lessons.length === 0 ? (
        <EmptyState title="No lessons added yet" />
      ) : (
        <div className="flex flex-col gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <CardTitle>{lesson.title}</CardTitle>
                <CardDescription>
                  Updated {new Date(lesson.updatedAt).toLocaleString()}
                </CardDescription>
                <CardAction className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => onEdit(lesson)}
                  >
                    <PencilIcon data-icon="inline-start" />
                    Edit
                  </Button>
                  {onDelete && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={saving}
                      onClick={() => onDelete(lesson.id)}
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Delete
                    </Button>
                  )}
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words">
                  {lesson.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
