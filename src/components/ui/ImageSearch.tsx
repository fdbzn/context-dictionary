"use client";

import { useState } from "react";
import type { PixabayImage, PixabayResponse } from "@/types";

interface ImageSearchProps {
  query: string;
  onSelect: (url: string) => void;
  selectedUrl?: string;
}

export default function ImageSearch({
  query,
  onSelect,
  selectedUrl,
}: ImageSearchProps) {
  const [images, setImages] = useState<PixabayImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(query);
  const [showPicker, setShowPicker] = useState(false);

  const searchImages = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pixabay?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: PixabayResponse = await res.json();
      setImages(data.hits || []);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setShowPicker(!showPicker);
          if (!showPicker && !images.length) {
            setSearchTerm(query);
            searchImages(query);
          }
        }}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {selectedUrl ? "Change Image" : "Search Image"}
      </button>

      {selectedUrl && !showPicker && (
        <div className="relative inline-block">
          <img
            src={selectedUrl}
            alt="Selected"
            className="h-32 w-48 rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={() => onSelect("")}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      {showPicker && (
        <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchImages(searchTerm);
              }}
              placeholder="Search for an image..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            />
            <button
              type="button"
              onClick={() => searchImages(searchTerm)}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    onSelect(img.webformatURL);
                    setShowPicker(false);
                  }}
                  className={`overflow-hidden rounded-lg border-2 transition-all hover:opacity-80 ${
                    selectedUrl === img.webformatURL
                      ? "border-indigo-500"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img.previewURL}
                    alt={img.tags}
                    className="h-20 w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {!loading && images.length === 0 && searchTerm && (
            <p className="text-center text-sm text-zinc-500">
              No images found. Try a different search term.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
