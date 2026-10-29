"use client";

import { useEffect, useState, type FormEvent } from "react";
import StudentForm from "./StudentForm";
import { apiFetch } from "@/lib/apiFetch";

import { PencilIcon, SearchIcon, Trash2Icon } from "lucide-react";

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  PageShell,
} from "@/components/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Student = {
  id: number;
  name: string;
  nic: string;
  email: string;
  phone: string;
  address: string;
};

export default function StudentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/students?search=${encodeURIComponent(search)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Could not load students.");
        }

        const data: Student[] = await response.json();
        setStudents(data);
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

    loadStudents();

    return () => controller.abort();
  }, [refreshKey, search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  async function deleteStudent(id: number) {
    if (!window.confirm("Delete this student?")) return;

    setDeletingId(id);
    setDeleteError("");

    try {
      const response = await apiFetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          "Could not delete the student. Check whether they have course enrolments."
        );
      }

      if (editingStudent?.id === id) {
        setEditingStudent(null);
      }

      setStudents((current) =>
        current.filter((student) => student.id !== id)
      );
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageShell width="xl">
      <PageHeader title="Students" />

      <StudentForm
        key={editingStudent?.id ?? "new"}
        student={editingStudent}
        onSaved={() => {
          setEditingStudent(null);
          setRefreshKey((value) => value + 1);
        }}
        onCancel={() => setEditingStudent(null)}
      />

      <form
        onSubmit={handleSearch}
        className="flex flex-wrap items-end gap-2"
      >
        <Field className="min-w-60 flex-1">
          <FieldLabel htmlFor="student-search">
            Search by student name
          </FieldLabel>
          <Input
            id="student-search"
            type="search"
            placeholder="Enter a name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </Field>
        <Button type="submit">
          <SearchIcon data-icon="inline-start" />
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearchInput("");
            setSearch("");
          }}
        >
          Clear
        </Button>
      </form>

      <ErrorAlert message={deleteError} title="Could not delete student" />

      {loading && <LoadingState label="Loading students..." />}

      <ErrorAlert message={error} />

      {!loading && !error && students.length === 0 && (
        <EmptyState title="No students found" />
      )}

      {!loading && !error && students.length > 0 && (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell className="font-mono">{student.nic}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell className="max-w-60 truncate">
                      {student.address}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deletingId !== null}
                          onClick={() => {
                            setEditingStudent(student);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <PencilIcon data-icon="inline-start" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deletingId !== null}
                          onClick={() => deleteStudent(student.id)}
                        >
                          {deletingId === student.id ? (
                            <Spinner data-icon="inline-start" />
                          ) : (
                            <Trash2Icon data-icon="inline-start" />
                          )}
                          {deletingId === student.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
