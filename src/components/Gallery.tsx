"use client";

import { useEffect, useState } from "react";

export default function Gallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <>
      <div className="no-bar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpen(i)}
            className="frame relative h-56 w-44 shrink-0 snap-center overflow-hidden sm:h-72 sm:w-56"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[open]} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  );
}
