"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";

import { ErrorAlert, SuccessAlert } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
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

type Student = {
  id: number;
  name: string;
  nic: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber?: string;
};

type Props = {
  student?: Student | null;
  onSaved: () => void;
  onCancel: () => void;
};

const emptyForm = {
  name: "",
  nic: "",
  email: "",
  phone: "",
  address: "",
};

export default function StudentForm({
  student,
  onSaved,
  onCancel,
}: Props) {
  const [form, setForm] = useState(
    student
      ? {
          name: student.name,
          nic: student.nic,
          email: student.email,
          phone: student.phone,
          address: student.address,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedRegistrationNumber, setSavedRegistrationNumber] =
    useState<string | null>(null);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        student ? `/api/students/${student.id}` : "/api/students",
        {
          method: student ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            nic: form.nic.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not save student. Check the details and use a unique NIC."
        );
      }

      const savedStudent: Student = await response.json();

      setSavedRegistrationNumber(
        savedStudent.registrationNumber ?? null
      );

      if (!student) {
        setForm(emptyForm);
        setMessage("Student registered successfully.");
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
        <CardTitle>{student ? "Edit student" : "Register student"}</CardTitle>
        <CardDescription>
          Registration number:{" "}
          <span className="font-mono font-medium text-foreground">
            {student?.registrationNumber ??
              savedRegistrationNumber ??
              "Generated after registration"}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="student-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <ErrorAlert message={error} title="Could not save student" />
            <SuccessAlert message={message} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="student-name">Name</FieldLabel>
                <Input
                  id="student-name"
                  required
                  maxLength={120}
                  disabled={saving}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="student-nic">NIC</FieldLabel>
                <Input
                  id="student-nic"
                  required
                  maxLength={20}
                  disabled={saving}
                  value={form.nic}
                  onChange={(event) => updateField("nic", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="student-email">Email</FieldLabel>
                <Input
                  id="student-email"
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
                <FieldLabel htmlFor="student-phone">Phone</FieldLabel>
                <Input
                  id="student-phone"
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
            </div>

            <Field>
              <FieldLabel htmlFor="student-address">Address</FieldLabel>
              <Textarea
                id="student-address"
                required
                maxLength={300}
                disabled={saving}
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
              />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button type="submit" form="student-form" disabled={saving}>
          {saving && <Spinner data-icon="inline-start" />}
          {saving
            ? "Saving..."
            : student
              ? "Update student"
              : "Register student"}
        </Button>
        {student && (
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
