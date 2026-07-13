"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => setUserName(data.name || data.email))
      .catch(() => setUserName(""));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
    }`;

  if (!userName) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-indigo-600 dark:text-indigo-400"
          >
            ContextDict
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
            <Link href="/phrases" className={linkClass("/phrases")}>
              Phrases
            </Link>
            <Link href="/study" className={linkClass("/study")}>
              Study
            </Link>
            <Link href="/options" className={linkClass("/options")}>
              Options
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:block">
            {userName}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            Logout
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-2 dark:border-zinc-800 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className={linkClass("/dashboard")}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/phrases"
              className={linkClass("/phrases")}
              onClick={() => setIsMenuOpen(false)}
            >
              Phrases
            </Link>
            <Link
              href="/study"
              className={linkClass("/study")}
              onClick={() => setIsMenuOpen(false)}
            >
              Study
            </Link>
            <Link
              href="/options"
              className={linkClass("/options")}
              onClick={() => setIsMenuOpen(false)}
            >
              Options
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
