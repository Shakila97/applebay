"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

import { ErrorAlert, SuccessAlert } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

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


  return (
    <Card>
      <CardHeader>
        <CardTitle>{course ? "Edit course" : "Add course"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="course-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <ErrorAlert message={error} title="Could not save course" />
            <SuccessAlert message={message} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="course-code">Course code</FieldLabel>
                <Input
                  id="course-code"
                  required
                  maxLength={30}
                  disabled={saving}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="course-name">Course name</FieldLabel>
                <Input
                  id="course-name"
                  required
                  maxLength={120}
                  disabled={saving}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="course-level">Level</FieldLabel>
                <Select
                  items={levelItems}
                  disabled={saving}
                  value={level}
                  onValueChange={(value) => setLevel(value ?? "HND")}
                >
                  <SelectTrigger id="course-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {levelItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="course-duration">Duration</FieldLabel>
                <Input
                  id="course-duration"
                  required
                  maxLength={60}
                  placeholder="e.g. 2 years"
                  disabled={saving}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button type="submit" form="course-form" disabled={saving}>
          {saving && <Spinner data-icon="inline-start" />}
          {saving ? "Saving..." : course ? "Update course" : "Save course"}
        </Button>
        {course && (
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
  );
}

const levelItems = [
  { label: "HND", value: "HND" },
  { label: "Certificate", value: "Certificate" },
];
