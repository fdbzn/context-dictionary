"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhraseCard from "@/components/ui/PhraseCard";
import type { Phrase } from "@/types";

export default function PhrasesPage() {
  const router = useRouter();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPhrases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/phrases?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPhrases(data.phrases || []);
    } catch {
      setPhrases([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPhrases();
  }, [fetchPhrases]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/phrases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPhrases((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            My Phrases
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Manage your English phrases and vocabulary
          </p>
        </div>
        <Link
          href="/phrases/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Phrase
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search phrases or words to learn..."
          className="w-full rounded-xl border border-zinc-300 py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && phrases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl">📝</div>
          <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            No phrases yet
          </h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Start by adding your first English phrase to study.
          </p>
          <Link
            href="/phrases/new"
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Add Your First Phrase
          </Link>
        </div>
      )}

      {/* Phrases list */}
      {!loading && phrases.length > 0 && (
        <div className="space-y-4">
          {phrases.map((phrase) => (
            <div key={phrase.id} className="group relative">
              <PhraseCard phrase={phrase} showMeaning showImage={false} />
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Link
                  href={`/phrases/${phrase.id}/edit`}
                  className="rounded-lg bg-white p-2 text-zinc-600 shadow-sm hover:text-indigo-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={() => setDeleteId(phrase.id)}
                  className="rounded-lg bg-white p-2 text-zinc-600 shadow-sm hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Delete Phrase
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this phrase? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
