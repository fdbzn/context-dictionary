import type { Phrase, PhraseTag } from "@/types";

interface PhraseCardProps {
  phrase: Phrase;
  showImage?: boolean;
  showMeaning?: boolean;
  showTagMeanings?: boolean;
  className?: string;
}

export default function PhraseCard({
  phrase,
  showImage = true,
  showMeaning = false,
  showTagMeanings = false,
  className = "",
}: PhraseCardProps) {
  const allTags = normalizeTags(phrase);

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {showImage && phrase.image_url && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img
            src={phrase.image_url}
            alt={allTags[0]?.word || "context"}
            className="h-48 w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-3">
        <p className="text-lg leading-relaxed text-zinc-900 dark:text-zinc-100">
          {renderTaggedText(phrase.content, allTags, showTagMeanings)}
        </p>

        {showMeaning && phrase.meaning && (
          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Meaning:
              </span>{" "}
              {phrase.meaning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeTags(phrase: Phrase): PhraseTag[] {
  if (phrase.tags && phrase.tags.length > 0) {
    const hasPositions = phrase.tags.every(
      (t) => typeof t.start === "number" && typeof t.end === "number",
    );
    if (hasPositions) return phrase.tags;
  }
  return buildFallbackTags(phrase);
}

function buildFallbackTags(phrase: Phrase): PhraseTag[] {
  const tags = phrase.tags && phrase.tags.length > 0 ? phrase.tags : [];
  if (tags.length > 0) {
    return tags.map((t, i) => ({
      id: t.id || `legacy-${i}`,
      word: t.word,
      meaning: t.meaning,
      start: -1,
      end: -1,
    }));
  }
  if (phrase.tag_to_learn) {
    return [
      {
        id: "legacy-0",
        word: phrase.tag_to_learn,
        meaning: phrase.tag_to_learn_meaning,
        start: -1,
        end: -1,
      },
    ];
  }
  return [];
}

function renderTaggedText(
  content: string,
  tags: PhraseTag[],
  showTagMeanings: boolean,
): React.ReactNode[] {
  const hasPositions = tags.length > 0 && tags[0].start >= 0;
  if (hasPositions && content) {
    return renderByPosition(content, tags, showTagMeanings);
  }
  return renderByRegex(content, tags, showTagMeanings);
}

function renderByPosition(
  content: string,
  tags: PhraseTag[],
  showTagMeanings: boolean,
): React.ReactNode[] {
  const sorted = [...tags].sort((a, b) => a.start - b.start);

  const validTags = sorted.filter((t) => {
    const slice = content.slice(t.start, t.end);
    return slice.toLowerCase() === t.word.toLowerCase();
  });

  if (validTags.length === 0 || validTags.length !== tags.length) {
    return renderByRegex(content, tags, showTagMeanings);
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const tag of validTags) {
    if (tag.start > cursor) {
      parts.push(
        <span key={`txt-${cursor}`}>{content.slice(cursor, tag.start)}</span>,
      );
    }
    parts.push(
      <TaggedWord
        key={tag.id}
        tagId={tag.id}
        word={content.slice(tag.start, tag.end)}
        meaning={tag.meaning}
        showMeaning={showTagMeanings}
      />,
    );
    cursor = tag.end;
  }

  if (cursor < content.length) {
    parts.push(<span key={`txt-${cursor}`}>{content.slice(cursor)}</span>);
  }

  return parts;
}

function renderByRegex(
  content: string,
  tags: PhraseTag[],
  showTagMeanings: boolean,
): React.ReactNode[] {
  const tagPattern = tags
    .map((t) => escapeRegex(t.word))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (tagPattern.length === 0) return [<span key="raw">{content}</span>];

  const regex = new RegExp(`(${tagPattern.join("|")})`, "gi");
  const parts = content.split(regex);

  return parts.map((part, i) => {
    const matchedTag = tags.find(
      (t) => t.word.toLowerCase() === part.toLowerCase(),
    );
    if (matchedTag) {
      return (
        <TaggedWord
          key={`${matchedTag.id || i}-${i}`}
          tagId={matchedTag.id || `${i}`}
          word={part}
          meaning={matchedTag.meaning}
          showMeaning={showTagMeanings}
        />
      );
    }
    return <span key={`plain-${i}`}>{part}</span>;
  });
}

function TaggedWord({
  word,
  meaning,
  showMeaning = true,
  tagId,
}: {
  word: string;
  meaning: string | null;
  showMeaning?: boolean;
  tagId: string;
}) {
  const hue = hashToHue(tagId);
  const bg = `hsl(${hue}, 75%, 88%)`;
  const fg = `hsl(${hue}, 50%, 22%)`;
  const accent = `hsl(${hue}, 40%, 40%)`;

  return (
    <mark
      className="rounded px-1 font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {word}
      {showMeaning && meaning && (
        <span className="text-xs font-normal" style={{ color: accent }}>
          {" "}
          ({meaning})
        </span>
      )}
    </mark>
  );
}

function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
