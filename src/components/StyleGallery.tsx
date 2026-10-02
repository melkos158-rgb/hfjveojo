"use client";

import Image from "next/image";
import { useState } from "react";
import type { StyleGalleryData } from "@/lib/tools/types";

/**
 * "One room, six styles" on a tool page: the same empty room and the real result of each style, picked with the
 * thumbnails. Only the chosen photo is loaded at full size; the thumbnails are small, so the section stays light.
 */
export function StyleGallery({ gallery }: { gallery: StyleGalleryData }) {
  const items = [{ label: "Empty", image: gallery.before }, ...gallery.styles];
  const [active, setActive] = useState(1);
  const current = items[active];
  return (
    <section id="styles" className="scroll-mt-20">
      <div className="container-x py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Six styles</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{gallery.title}</h2>
          </div>
          <p className="max-w-md text-sm text-gray-500">{gallery.intro}</p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-line bg-card-2">
          <div className="relative">
            <Image
              key={current.image.src}
              src={current.image.src}
              alt={current.image.alt}
              width={current.image.width}
              height={current.image.height}
              unoptimized
              className="h-auto w-full"
            />
            <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
              {active === 0 ? "Empty room, as photographed" : `${current.label} · virtually staged`}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7" role="group" aria-label="Choose a style">
          {items.map((it, i) => (
            <button
              key={it.label}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`group overflow-hidden rounded-xl border text-left transition ${i === active ? "border-accent ring-2 ring-accent/40" : "border-line hover:border-accent/60"}`}
            >
              <Image src={it.image.thumb} alt="" width={360} height={240} unoptimized className="h-auto w-full" />
              <span className={`block truncate px-1 py-1.5 text-[10px] font-semibold tracking-tight whitespace-nowrap sm:px-2 sm:text-xs sm:tracking-normal ${i === active ? "text-accent" : "text-gray-700"}`}>{it.label}</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-500">{gallery.caption}</p>
        {gallery.link ? (
          <a href={gallery.link.href} className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">
            {gallery.link.label} →
          </a>
        ) : null}
        </div>
      </div>
    </section>
  );
}
