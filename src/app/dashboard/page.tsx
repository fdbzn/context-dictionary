"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { UserStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([userData, statsData]) => {
        setUserName(userData.name || userData.email || "");
        setStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  const accuracy = stats
    ? Math.round(
        (stats.correct_answers /
          Math.max(stats.correct_answers + stats.incorrect_answers, 1)) *
          100
      )
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Welcome back{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Here&apos;s your learning progress
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/phrases/new"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + New Phrase
          </Link>
          <Link
            href="/study"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Start Studying
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Phrases"
          value={stats?.total_phrases ?? 0}
          icon="📝"
        />
        <StatCard
          title="Study Sessions"
          value={stats?.total_study_sessions ?? 0}
          icon="🎯"
        />
        <StatCard
          title="Accuracy"
          value={`${accuracy}%`}
          icon="📊"
          subtitle={`${stats?.correct_answers ?? 0} correct, ${stats?.incorrect_answers ?? 0} incorrect`}
        />
        <StatCard
          title="Study Streak"
          value={`${stats?.current_streak ?? 0} days`}
          icon="🔥"
        />
        <StatCard
          title="Studied Today"
          value={stats?.studied_today ? "Yes" : "No"}
          icon={stats?.studied_today ? "✅" : "❌"}
          valueClass={
            stats?.studied_today
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
        />
        <StatCard
          title="Phrases to Review"
          value={
            (stats?.total_phrases ?? 0) -
            (stats?.correct_answers ?? 0)
          }
          icon="📚"
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/phrases"
            className="rounded-lg border border-zinc-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <div className="text-2xl">📖</div>
            <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Manage Phrases
            </div>
          </Link>
          <Link
            href="/study"
            className="rounded-lg border border-zinc-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <div className="text-2xl">🧠</div>
            <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Study Mode
            </div>
          </Link>
          <Link
            href="/options"
            className="rounded-lg border border-zinc-200 p-4 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <div className="text-2xl">⚙️</div>
            <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Options
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  valueClass,
}: {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p
            className={`mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50 ${
              valueClass ?? ""
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
