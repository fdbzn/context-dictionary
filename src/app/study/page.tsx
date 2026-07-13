"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import PhraseCard from "@/components/ui/PhraseCard";
import type { Phrase } from "@/types";

interface StudyResult {
  phrase: Phrase;
  isCorrect: boolean;
  userExample: string;
}

type Step = "view" | "judge" | "example";

export default function StudyPage() {
  const router = useRouter();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<Step>("view");
  const [userExample, setUserExample] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<StudyResult[]>([]);
  const [config, setConfig] = useState({ phrases_per_session: 10 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [error, setError] = useState("");
  const [configLoading, setConfigLoading] = useState(true);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch("/api/study/config", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load config");
        return r.json();
      })
      .then((data) => {
        if (data.phrases_per_session) setConfig(data);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeoutId);
        setConfigLoading(false);
      });

    return () => clearTimeout(timeoutId);
  }, []);

  const startStudy = useCallback(async () => {
    setLoading(true);
    setError("");
    setStep("view");
    setIsCorrect(null);
    setUserExample("");

    const fetchId = ++fetchIdRef.current;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(
        `/api/study?limit=${config.phrases_per_session}`,
        {
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);
      if (fetchId !== fetchIdRef.current) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (fetchId !== fetchIdRef.current) return;

      if (!data.phrases?.length) {
        setPhrases([]);
        setStarted(true);
        return;
      }

      setPhrases(data.phrases);
      setCurrentIndex(0);
      setResults([]);
      setSessionComplete(false);
      setStarted(true);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      setError(
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out. Please try again."
            : err.message
          : "Something went wrong",
      );
      console.error("Study fetch error:", err);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [config.phrases_per_session]);

  const reveal = useCallback(() => {
    setStep("judge");
  }, []);

  const judge = useCallback((correct: boolean) => {
    setIsCorrect(correct);
    setStep("example");
  }, []);

  const saveAndNext = useCallback(() => {
    const currentPhrase = phrases[currentIndex];
    if (!currentPhrase) return;

    const result: StudyResult = {
      phrase: currentPhrase,
      isCorrect: isCorrect ?? false,
      userExample,
    };

    // Fire and forget — don't block the flow
    fetch("/api/study/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phrase_id: currentPhrase.id,
        is_correct: isCorrect,
        user_example: userExample || null,
      }),
    }).catch(() => {});

    setResults((prev) => [...prev, result]);
    setUserExample("");
    setIsCorrect(null);
    setStep("view");

    if (currentIndex + 1 >= phrases.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [phrases, currentIndex, isCorrect, userExample]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only active during study
      if (!started || loading || sessionComplete || phrases.length === 0)
        return;

      if (step === "view") {
        if (e.key === "Enter") {
          e.preventDefault();
          reveal();
        }
      } else if (step === "judge") {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          judge(true);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          judge(false);
        }
      } else if (step === "example") {
        if (e.key === "Enter") {
          e.preventDefault();
          saveAndNext();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    started,
    loading,
    sessionComplete,
    phrases.length,
    step,
    reveal,
    judge,
    saveAndNext,
  ]);

  if (configLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="max-w-lg text-center">
          <div className="text-6xl">🧠</div>
          <h1 className="mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Study Mode
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            You&apos;ll see {config.phrases_per_session} random phrases. Try to
            recall the meaning, press{" "}
            <kbd className="rounded border px-1 text-xs">Enter</kbd> to reveal,
            then use <kbd className="rounded border px-1 text-xs">←</kbd> /
            <kbd className="rounded border px-1 text-xs">→</kbd> to judge.
          </p>
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}
          <button
            onClick={startStudy}
            disabled={loading}
            className="mt-8 rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Start Study Session"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-zinc-500">Preparing your study session...</p>
        </div>
      </div>
    );
  }

  if (phrases.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          No phrases to study!
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Add some phrases first, then come back to study them.
        </p>
        <button
          onClick={() => router.push("/phrases/new")}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Add Phrases
        </button>
      </div>
    );
  }

  return (
    <StudyContent
      phrases={phrases}
      currentIndex={currentIndex}
      step={step}
      isCorrect={isCorrect}
      userExample={userExample}
      setUserExample={setUserExample}
      onReveal={reveal}
      onJudge={judge}
      onSaveAndNext={saveAndNext}
      results={results}
      sessionComplete={sessionComplete}
      onRestart={startStudy}
      router={router}
    />
  );
}

/* ═══════════════ Study Content ═══════════════ */

function StudyContent({
  phrases,
  currentIndex,
  step,
  isCorrect,
  userExample,
  setUserExample,
  onReveal,
  onJudge,
  onSaveAndNext,
  results,
  sessionComplete,
  onRestart,
  router,
}: {
  phrases: Phrase[];
  currentIndex: number;
  step: Step;
  isCorrect: boolean | null;
  userExample: string;
  setUserExample: (v: string) => void;
  onReveal: () => void;
  onJudge: (correct: boolean) => void;
  onSaveAndNext: () => void;
  results: StudyResult[];
  sessionComplete: boolean;
  onRestart: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  if (sessionComplete)
    return (
      <SessionSummary results={results} onRestart={onRestart} router={router} />
    );

  const currentPhrase = phrases[currentIndex];
  const progress = ((currentIndex + 1) / phrases.length) * 100;
  const showMeanings = step !== "view"; // revealed in judge and example steps

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Phrase {currentIndex + 1} of {phrases.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phrase */}
      <PhraseCard
        phrase={currentPhrase}
        showImage={true}
        showMeaning={showMeanings}
        showTagMeanings={showMeanings}
        className="mb-6"
      />

      {/* ── Step 1: View ── */}
      {step === "view" && (
        <button
          onClick={onReveal}
          className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
        >
          🤔 Tap to reveal meaning &nbsp;
          <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">
            Enter
          </kbd>
        </button>
      )}

      {/* ── Step 2: Judge ── */}
      {step === "judge" && (
        <div className="flex gap-3">
          <button
            onClick={() => onJudge(false)}
            className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            ❌ I Got It Wrong &nbsp;
            <kbd className="rounded bg-red-700 px-1.5 py-0.5 text-xs">←</kbd>
          </button>
          <button
            onClick={() => onJudge(true)}
            className="flex-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
          >
            ✅ I Got It Right &nbsp;
            <kbd className="rounded bg-green-700 px-1.5 py-0.5 text-xs">→</kbd>
          </button>
        </div>
      )}

      {/* ── Step 3: Example ── */}
      {step === "example" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {`Write your own example using "${currentPhrase.tags?.[0]?.word || currentPhrase.tag_to_learn}"`}
          </label>
          <textarea
            value={userExample}
            onChange={(e) => setUserExample(e.target.value)}
            rows={2}
            autoFocus
            placeholder="Write a new sentence using this word/phrase..."
            className="mt-1 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={onSaveAndNext}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Save & Continue &nbsp;
            <kbd className="rounded bg-indigo-700 px-1.5 py-0.5 text-xs">
              Enter
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Session Summary ═══════════════ */

function SessionSummary({
  results,
  onRestart,
  router,
}: {
  results: StudyResult[];
  onRestart: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-lg text-center">
        <div className="text-6xl">
          {pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}
        </div>
        <h2 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Session Complete!
        </h2>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            {correct}/{total}
          </div>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {pct}% accuracy
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-3 text-left">
          {results.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">
                  {r.isCorrect ? "✅" : "❌"}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {r.phrase.content}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Tag: {r.phrase.tags?.[0]?.word || r.phrase.tag_to_learn}
                  </p>
                  {r.userExample && (
                    <p className="mt-1 text-xs italic text-zinc-500">
                      Your example: {r.userExample}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={onRestart}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Study Again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
