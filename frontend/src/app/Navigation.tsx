"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/students", label: "Students" },
  { href: "/enrolments", label: "Enrolments" },
  { href: "/attendance", label: "Mark Attendance" },
  { href: "/attendance/history", label: "Attendance History" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <p className="mb-4 text-xl font-bold">Applebay Institute</p>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap gap-2"
        >
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded bg-blue-700 px-3 py-2 text-white"
                    : "rounded border px-3 py-2 hover:bg-blue-50 hover:text-blue-900"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
