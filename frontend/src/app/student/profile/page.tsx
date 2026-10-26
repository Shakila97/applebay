"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type CsrfResponse = {
  token: string;
  headerName: string;
};

export default function StudentProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    nic: "",
    phone: "",
    address: "",
  });

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function checkProfile() {
      try {
        const response = await fetch("/api/student/profile", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error("A Student account is required.");
        }

        if (response.status === 404) {
          setCanCreate(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Could not check your profile.");
        }

        // Students with a profile return to their dashboard.
        router.replace("/student");
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    }

    checkProfile();

    return () => controller.abort();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not prepare your request.");
      }

      const csrf: CsrfResponse = await csrfResponse.json();

      const response = await fetch("/api/student/profile", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          nic: form.nic.trim().toUpperCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 409) {
        throw new Error(
          "Your profile already exists, or this NIC is already registered. Contact the administrator if you have an existing student record."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not save your profile. Check your details and try again."
        );
      }

      router.replace("/student");
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
      <h1 className="mb-3 text-3xl font-bold">
        Complete your student profile
      </h1>

      <p className="mb-6">
        Your registration number will be generated after saving.
        Your email comes from your login account.
      </p>

      {checking && <p role="status">Checking your account...</p>}

      {error && (
        <p role="alert" className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {!checking && canCreate && (
        <form
          onSubmit={handleSubmit}
          className="rounded border p-5"
        >
          <fieldset disabled={saving} className="space-y-4">
            <label className="block">
              Name
              <input
                required
                maxLength={120}
                autoComplete="name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className={inputStyle}
              />
            </label>

            <label className="block">
              NIC
              <input
                required
                maxLength={12}
                pattern="([0-9]{9}[VvXx]|[0-9]{12})"
                title="Enter 9 digits followed by V/X, or 12 digits"
                value={form.nic}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nic: event.target.value.toUpperCase(),
                  })
                }
                className={inputStyle}
              />
            </label>

            <label className="block">
              Phone
              <input
                required
                type="tel"
                maxLength={30}
                autoComplete="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className={inputStyle}
              />
            </label>

            <label className="block">
              Address
              <textarea
                required
                maxLength={300}
                autoComplete="street-address"
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                className={inputStyle}
              />
            </label>

            <button
              type="submit"
              className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Complete registration"}
            </button>
          </fieldset>
        </form>
      )}
    </main>
  );
}
