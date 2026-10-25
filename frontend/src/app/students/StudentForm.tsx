"use client";

import { useState, type FormEvent } from "react";

type Student = {
  id: number;
  name: string;
  nic: string;
  email: string;
  phone: string;
  address: string;
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

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
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

  const inputStyle = "mt-1 w-full rounded border p-2";

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded border p-5">
      <h2 className="mb-4 text-xl font-semibold">
        {student ? "Edit student" : "Register student"}
      </h2>

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
          NIC
          <input
            required
            maxLength={20}
            value={form.nic}
            onChange={(event) => updateField("nic", event.target.value)}
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
          Address
          <textarea
            required
            maxLength={300}
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            className={inputStyle}
          />
        </label>

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : student
              ? "Update student"
              : "Register student"}
        </button>

        {student && (
          <button
            type="button"
            onClick={onCancel}
            className="ml-3 rounded border px-4 py-2"
          >
            Cancel
          </button>
        )}
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