"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageSearch from "@/components/ui/ImageSearch";
import type { PhraseTag } from "@/types";

interface PhraseDraft {
  id: string;
  content: string;
  meaning: string;
  tags: PhraseTag[];
  imageUrl: string;
  showImageSearch: boolean;
}

const DRAFT_KEY = "phrases-draft";
let idCounter = 0;

function genId(): string {
  return `t${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

function newDraft(): PhraseDraft {
  return {
    id: crypto.randomUUID(),
    content: "",
    meaning: "",
    tags: [],
    imageUrl: "",
    showImageSearch: false,
  };
}

export default function NewPhrasePage() {
  const router = useRouter();
  const [phrases, setPhrases] = useState<PhraseDraft[]>([newDraft()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((p: Record<string, unknown>) => ({
            id: p.id || crypto.randomUUID(),
            content: (p.content as string) || "",
            meaning: (p.meaning as string) || "",
            tags: Array.isArray(p.tags)
              ? (p.tags as unknown[]).map(migrateTag)
              : (p.tagToLearn as string)
                ? [
                    {
                      id: genId(),
                      word: p.tagToLearn as string,
                      meaning: (p.tagToLearnMeaning as string) || null,
                      start: -1,
                      end: -1,
                    },
                  ]
                : [],
            imageUrl: (p.imageUrl as string) || "",
            showImageSearch: Boolean(p.showImageSearch),
          }));
          setPhrases(migrated as PhraseDraft[]);
        }
      }
    } catch {}
  }, []);

  const saveDraft = useCallback((drafts: PhraseDraft[]) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    setLastSaved(new Date());
  }, []);

  const updatePhrase = useCallback(
    (id: string, updates: Partial<PhraseDraft>) => {
      setPhrases((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        saveDraft(next);
        return next;
      });
    },
    [saveDraft],
  );

  const addPhrase = () => {
    setPhrases((prev) => {
      const next = [...prev, newDraft()];
      saveDraft(next);
      return next;
    });
  };

  const removePhrase = (id: string) => {
    setPhrases((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((p) => p.id !== id);
      saveDraft(next);
      return next;
    });
  };

  const handleSaveAll = async () => {
    setError("");
    const validPhrases = phrases.filter(
      (p) => p.content.trim() && p.tags.length > 0,
    );

    if (validPhrases.length === 0) {
      setError(
        "At least one phrase with content and highlighted words is required.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          validPhrases.map((p) => ({
            content: p.content,
            meaning: p.meaning,
            tags: p.tags.map((t) => ({
              id: t.id,
              word: t.word,
              meaning: t.meaning,
              start: t.start,
              end: t.end,
            })),
            image_url: p.imageUrl || null,
          })),
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      localStorage.removeItem(DRAFT_KEY);
      setSuccess(true);
      setTimeout(() => {
        router.push("/phrases");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const totalReady = phrases.filter(
    (p) => p.content.trim() && p.tags.length > 0,
  ).length;
  const totalWithContent = phrases.filter((p) => p.content.trim()).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/phrases"
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            &larr; Back to phrases
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Add New Phrases
          </h1>
        </div>
        <div className="text-right">
          {lastSaved && (
            <p className="text-xs text-zinc-400">
              Auto-saved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {phrases.map((phrase, index) => (
          <PhraseEditor
            key={phrase.id}
            phrase={phrase}
            index={index}
            total={phrases.length}
            onUpdate={(updates) => updatePhrase(phrase.id, updates)}
            onRemove={() => removePhrase(phrase.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addPhrase}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-400 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-700 dark:hover:border-indigo-500"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Another Phrase
      </button>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-600 dark:bg-green-950 dark:text-green-400">
          Phrases saved! Redirecting...
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : `Save ${totalReady > 0 ? totalReady : totalWithContent} Phrase${totalReady > 0 && totalReady !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

/* ── Migrate old tag format ── */

function migrateTag(t: unknown): PhraseTag {
  const raw = t as Record<string, unknown>;
  return {
    id: (raw.id as string) || genId(),
    word: (raw.word as string) || "",
    meaning: (raw.meaning as string) || null,
    start: typeof raw.start === "number" ? (raw.start as number) : -1,
    end: typeof raw.end === "number" ? (raw.end as number) : -1,
  };
}

/* ═══════════════ Phrase Editor ═══════════════ */

function PhraseEditor({
  phrase,
  index,
  total,
  onUpdate,
  onRemove,
}: {
  phrase: PhraseDraft;
  index: number;
  total: number;
  onUpdate: (updates: Partial<PhraseDraft>) => void;
  onRemove: () => void;
}) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [showTagIcon, setShowTagIcon] = useState(false);
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [selectionText, setSelectionText] = useState("");
  const [tagMeaning, setTagMeaning] = useState("");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [iconPosition, setIconPosition] = useState({ top: 0, left: 0 });
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const wordCount = phrase.content.trim().split(/\s+/).filter(Boolean).length;

  // ── Text selection handler ──
  const handleContentSelect = () => {
    const textarea = contentRef.current;
    if (!textarea) return;

    requestAnimationFrame(() => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) {
        setShowTagIcon(false);
        return;
      }

      const selected = textarea.value.substring(start, end).trim();
      if (!selected) {
        setShowTagIcon(false);
        return;
      }

      const alreadyTagged = phrase.tags.some(
        (t) => t.start === start && t.end === end,
      );
      if (alreadyTagged) {
        setShowTagIcon(false);
        return;
      }

      setSelectionText(selected);
      setSelectionStart(start);
      setSelectionEnd(end);
      setTagMeaning("");
      setShowTagPopup(false);

      // Position icon ABOVE the selection (viewport-relative, icon is fixed)
      const rect = textarea.getBoundingClientRect();
      const avgX =
        rect.left +
        ((start + end) / 2 / Math.max(textarea.value.length, 1)) * rect.width;
      setIconPosition({
        top: Math.max(8, rect.top - 42), // never go above viewport
        left: Math.max(8, avgX - 36),
      });
      setPopupPosition({
        top: Math.max(8, rect.top - 120),
        left: Math.max(8, Math.min(avgX - 160, window.innerWidth - 320)),
      });
      setShowTagIcon(true);
    });
  };

  // ── Open popup from icon click ──
  const openPopup = () => {
    setShowTagIcon(false);
    setShowTagPopup(true);
  };

  const closeAll = () => {
    setShowTagIcon(false);
    setShowTagPopup(false);
    contentRef.current?.focus();
  };

  // Close icon/popup when clicking outside
  useEffect(() => {
    if (!showTagIcon && !showTagPopup) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on the icon or popup itself
      if (iconRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      closeAll();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTagIcon, showTagPopup]);

  // ── Add tag with positions ──
  const confirmTag = () => {
    if (!selectionText) return;
    const newTag: PhraseTag = {
      id: genId(),
      word: selectionText,
      meaning: tagMeaning.trim() || null,
      start: selectionStart,
      end: selectionEnd,
    };
    onUpdate({ tags: [...phrase.tags, newTag] });
    setShowTagPopup(false);
    setSelectionText("");
    setTagMeaning("");
    setShowTagIcon(false);
    contentRef.current?.focus();
  };

  const removeTag = (tagId: string) => {
    onUpdate({ tags: phrase.tags.filter((t) => t.id !== tagId) });
  };

  // Generate a consistent color from a tag ID
  const tagHue = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++)
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return ((hash % 360) + 360) % 360;
  };

  // Sort tags by position for display
  const sortedTags = [...phrase.tags].sort((a, b) => a.start - b.start);

  return (
    <div className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Phrase {index + 1} of {total}
        </span>
        <div className="flex items-center gap-2">
          {phrase.tags.length > 0 && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {phrase.tags.length} tag{phrase.tags.length > 1 ? "s" : ""}
            </span>
          )}
          {total > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
              title="Remove this phrase"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Content textarea ── */}
      <div className="relative">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Phrase / Sentence *
        </label>
        <p className="mt-0.5 text-xs text-zinc-400">
          Select words with your mouse to mark them as words to learn.
        </p>
        <textarea
          ref={contentRef}
          value={phrase.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          onMouseUp={handleContentSelect}
          onKeyUp={(e) => {
            if (e.shiftKey) handleContentSelect();
          }}
          rows={3}
          required
          placeholder="e.g., I need to go to the bank to deposit some money."
          className="mt-1 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />

        {/* ── Colored preview ── */}
        {phrase.content && phrase.tags.length > 0 && (
          <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-800/50">
            {renderColoredPreview(phrase.content, phrase.tags, tagHue)}
          </div>
        )}

        {/* ── Floating tag icon ── */}
        {showTagIcon && (
          <button
            ref={iconRef}
            type="button"
            onClick={openPopup}
            className="fixed z-40 flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-500"
            style={{
              top: Math.max(10, iconPosition.top),
              left: Math.max(10, iconPosition.left),
            }}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar
          </button>
        )}

        {/* ── Floating tag popup ── */}
        {showTagPopup && (
          <div
            ref={popupRef}
            className="fixed z-50 w-80 rounded-xl border border-indigo-200 bg-white p-4 shadow-lg dark:border-indigo-800 dark:bg-zinc-800"
            style={{
              top: Math.max(10, popupPosition.top),
              left: Math.min(
                Math.max(10, popupPosition.left),
                (typeof window !== "undefined" ? window.innerWidth : 1024) -
                  340,
              ),
            }}
          >
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Word to learn
            </p>
            <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              &ldquo;{selectionText}&rdquo;
            </p>
            <input
              type="text"
              value={tagMeaning}
              onChange={(e) => setTagMeaning(e.target.value)}
              placeholder="Meaning of this word (optional)"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmTag();
                }
                if (e.key === "Escape") {
                  closeAll();
                }
              }}
              className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={confirmTag}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Add Tag
              </button>
              <button
                type="button"
                onClick={() => closeAll()}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tags chips (sorted by position) ── */}
      {sortedTags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Words to learn:
          </span>
          {sortedTags.map((tag) => {
            const hue = tagHue(tag.id);
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold"
                style={{
                  backgroundColor: `hsl(${hue}, 75%, 88%)`,
                  color: `hsl(${hue}, 50%, 22%)`,
                }}
              >
                {tag.word}
                {tag.meaning && (
                  <span
                    className="ml-0.5 text-xs font-normal"
                    style={{ color: `hsl(${hue}, 40%, 40%)` }}
                  >
                    ({tag.meaning})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="ml-0.5 text-yellow-600 hover:text-red-500 dark:text-yellow-400 dark:hover:text-red-400"
                  title="Remove this tag"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Full meaning (only if >1 word) ── */}
      {wordCount > 1 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Meaning of the full phrase
          </label>
          <textarea
            value={phrase.meaning}
            onChange={(e) => onUpdate({ meaning: e.target.value })}
            rows={2}
            placeholder="Explain what this whole sentence means..."
            className="mt-1 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      {/* ── Image ── */}
      <div className="mt-4">
        {!phrase.showImageSearch ? (
          <button
            type="button"
            onClick={() => onUpdate({ showImageSearch: true })}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add image <span className="text-xs text-zinc-400">(optional)</span>
          </button>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Context Image
              </span>
              <span className="text-xs text-zinc-400">optional</span>
            </div>
            <ImageSearch
              query={
                sortedTags[0]?.word ||
                phrase.content.split(" ").slice(-2).join(" ")
              }
              onSelect={(url) => onUpdate({ imageUrl: url })}
              selectedUrl={phrase.imageUrl}
            />
            {phrase.imageUrl && (
              <button
                type="button"
                onClick={() =>
                  onUpdate({ imageUrl: "", showImageSearch: false })
                }
                className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Remove image
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Colored preview renderer ── */

function renderColoredPreview(
  content: string,
  tags: PhraseTag[],
  hueFn: (id: string) => number,
): React.ReactNode[] {
  const sorted = [...tags]
    .filter((t) => t.start >= 0 && t.end <= content.length)
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) return [<span key="raw">{content}</span>];

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const tag of sorted) {
    const slice = content.slice(tag.start, tag.end);
    if (slice.toLowerCase() !== tag.word.toLowerCase()) continue;

    if (tag.start > cursor) {
      parts.push(
        <span key={`txt-${cursor}`}>{content.slice(cursor, tag.start)}</span>,
      );
    }
    const hue = hueFn(tag.id);
    parts.push(
      <span
        key={tag.id}
        className="rounded px-1 font-semibold"
        style={{
          backgroundColor: `hsl(${hue}, 75%, 88%)`,
          color: `hsl(${hue}, 50%, 22%)`,
        }}
      >
        {slice}
        {tag.meaning && (
          <span
            className="text-xs font-normal"
            style={{ color: `hsl(${hue}, 40%, 40%)` }}
          >
            {" "}
            ({tag.meaning})
          </span>
        )}
      </span>,
    );
    cursor = tag.end;
  }
  if (cursor < content.length) {
    parts.push(<span key={`txt-${cursor}`}>{content.slice(cursor)}</span>);
  }

  return parts;
}
