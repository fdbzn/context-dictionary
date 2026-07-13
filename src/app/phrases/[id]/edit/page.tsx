"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageSearch from "@/components/ui/ImageSearch";
import type { Phrase, PhraseTag } from "@/types";

let idCounter = 0;
function genId(): string {
  return `t${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

export default function EditPhrasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [content, setContent] = useState("");
  const [meaning, setMeaning] = useState("");
  const [tags, setTags] = useState<PhraseTag[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/phrases/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: Phrase) => {
        setContent(data.content || "");
        setMeaning(data.meaning || "");
        setTags(normalizeTags(data));
        setImageUrl(data.image_url || "");
      })
      .catch(() => {
        router.push("/phrases");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/phrases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          meaning,
          tags: tags.map((t) => ({
            id: t.id,
            word: t.word,
            meaning: t.meaning,
            start: t.start,
            end: t.end,
          })),
          image_url: imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      router.push("/phrases");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const addTag = (word: string) => {
    if (!word.trim()) return;
    if (
      tags.some(
        (t) => t.word.toLowerCase() === word.toLowerCase() && t.start < 0,
      )
    )
      return;
    setTags((prev) => [
      ...prev,
      { id: genId(), word, meaning: null, start: -1, end: -1 },
    ]);
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTagMeaning = (index: number, meaning: string) => {
    setTags((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, meaning: meaning || null } : t,
      ),
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/phrases"
        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        &larr; Back to phrases
      </Link>
      <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Edit Phrase
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Phrase / Sentence *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
            className="mt-1 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Tags management */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Words to Learn (Tags)
          </label>
          <p className="mt-0.5 text-xs text-zinc-400">
            Add words from the sentence above. Each can have its own meaning.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <div
                key={tag.id || i}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  {tag.word}
                </span>
                <input
                  type="text"
                  value={tag.meaning || ""}
                  onChange={(e) => updateTagMeaning(i, e.target.value)}
                  placeholder="meaning"
                  className="w-32 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Add a word to learn..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = (e.target as HTMLButtonElement)
                  .previousElementSibling as HTMLInputElement;
                addTag(input.value);
                input.value = "";
              }}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Full Phrase Meaning
          </label>
          <textarea
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Context Image
          </label>
          <div className="mt-1">
            <ImageSearch
              query={tags[0]?.word || ""}
              onSelect={setImageUrl}
              selectedUrl={imageUrl}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/phrases"
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function normalizeTags(data: Phrase): PhraseTag[] {
  if (data.tags && data.tags.length > 0) {
    const hasPositions = data.tags.every(
      (t) => typeof t.start === "number" && typeof t.end === "number",
    );
    if (hasPositions) return data.tags;
    // Old tags without positions — try to find them in content
    return data.tags.map((t) => {
      const idx = data.content.indexOf(t.word);
      return {
        id: t.id || genId(),
        word: t.word,
        meaning: t.meaning,
        start: idx >= 0 ? idx : -1,
        end: idx >= 0 ? idx + t.word.length : -1,
      };
    });
  }
  if (data.tag_to_learn) {
    const idx = data.content.indexOf(data.tag_to_learn);
    return [
      {
        id: genId(),
        word: data.tag_to_learn,
        meaning: data.tag_to_learn_meaning,
        start: idx >= 0 ? idx : -1,
        end: idx >= 0 ? idx + data.tag_to_learn.length : -1,
      },
    ];
  }
  return [];
}
