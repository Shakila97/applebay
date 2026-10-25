"use client";

import { useEffect, useState, type FormEvent } from "react";
import StudentForm from "./StudentForm";

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
      const response = await fetch(`/api/students/${id}`, {
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
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Students</h1>

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
        className="mb-6 flex flex-wrap items-end gap-3"
      >
        <label className="flex-1">
          Search by student name
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Enter a name"
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-white"
        >
          Search
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchInput("");
            setSearch("");
          }}
          className="rounded border px-4 py-2"
        >
          Clear
        </button>
      </form>

      {deleteError && (
        <p role="alert" className="mb-4 text-red-600">
          {deleteError}
        </p>
      )}

      {loading &&<p role="status">Loading students...</p>}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && students.length === 0 && (
        <p>No students found.</p>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">Name</th>
                <th className="p-3">NIC</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Address</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.nic}</td>
                  <td className="p-3">{student.email}</td>
                  <td className="p-3">{student.phone}</td>
                  <td className="p-3">{student.address}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => {
                        setEditingStudent(student);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="mr-2 rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => deleteStudent(student.id)}
                      className="rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50"
                    >
                      {deletingId === student.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}