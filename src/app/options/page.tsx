"use client";

import { useState, useEffect, FormEvent } from "react";

export default function OptionsPage() {
  const [phrasesPerSession, setPhrasesPerSession] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/study/config")
      .then((r) => r.json())
      .then((data) => {
        setPhrasesPerSession(data.phrases_per_session || 10);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/study/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases_per_session: phrasesPerSession }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setMessage("Settings saved successfully!");
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Study Options
      </h1>
      <p className="mt-1 text-zinc-500 dark:text-zinc-400">
        Configure your study preferences
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Phrases per Study Session
          </label>
          <p className="mt-0.5 text-xs text-zinc-400">
            How many phrases do you want to study in each session?
          </p>

          <div className="mt-4 flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={50}
              value={phrasesPerSession}
              onChange={(e) => setPhrasesPerSession(parseInt(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="min-w-[3rem] text-center text-lg font-semibold text-indigo-600 dark:text-indigo-400">
              {phrasesPerSession}
            </span>
          </div>

          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-xl p-4 text-sm ${
              message.includes("success")
                ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
