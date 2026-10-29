"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

import {
  ErrorAlert,
  PageHeader,
  PageShell,
  SuccessAlert,
} from "@/components/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

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


  return (
    <PageShell width="sm">
      <PageHeader backHref="/admin" title="Register lecturer" />

      <ErrorAlert message={error} />
      <SuccessAlert
        message={
          savedLecturer
            ? `Lecturer registered: ${savedLecturer.name} — ${savedLecturer.email}`
            : ""
        }
      />

      <Card>
        <CardContent>
          <form id="lecturer-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  required
                  maxLength={120}
                  disabled={saving}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  required
                  type="tel"
                  maxLength={30}
                  disabled={saving}
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  required
                  type="email"
                  maxLength={150}
                  disabled={saving}
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Initial password</FieldLabel>
                <Input
                  id="password"
                  required
                  type="password"
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  disabled={saving}
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                />
                <FieldDescription>
                  At least 8 characters. Share it with the lecturer securely.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="lecturer-form" disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            {saving ? "Saving..." : "Register lecturer"}
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  );
}
