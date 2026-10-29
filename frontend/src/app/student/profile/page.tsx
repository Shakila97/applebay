"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
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
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <PageShell width="sm">
      <PageHeader
        title="Complete your student profile"
        description="Your registration number will be generated after saving. Your email comes from your login account."
      />

      {checking && <LoadingState label="Checking your account..." rows={1} />}

      <ErrorAlert message={error} />

      {!checking && canCreate && (
        <Card>
          <CardContent>
            <form id="profile-form" onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    required
                    maxLength={120}
                    autoComplete="name"
                    disabled={saving}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="nic">NIC</FieldLabel>
                  <Input
                    id="nic"
                    required
                    maxLength={12}
                    pattern="([0-9]{9}[VvXx]|[0-9]{12})"
                    title="Enter 9 digits followed by V/X, or 12 digits"
                    disabled={saving}
                    value={form.nic}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        nic: event.target.value.toUpperCase(),
                      })
                    }
                  />
                  <FieldDescription>
                    9 digits followed by V or X, or 12 digits.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    required
                    type="tel"
                    maxLength={30}
                    autoComplete="tel"
                    disabled={saving}
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Textarea
                    id="address"
                    required
                    maxLength={300}
                    autoComplete="street-address"
                    disabled={saving}
                    value={form.address}
                    onChange={(event) =>
                      setForm({ ...form, address: event.target.value })
                    }
                  />
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="profile-form" disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              {saving ? "Saving..." : "Complete registration"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </PageShell>
  );
}
