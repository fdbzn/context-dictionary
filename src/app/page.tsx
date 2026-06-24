import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Learn English with{" "}
          <span className="text-indigo-600 dark:text-indigo-400">Context</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Save phrases, highlight words to learn, study with spaced repetition,
          and reinforce your memory with contextual images.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-300 px-8 py-3 text-base font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
