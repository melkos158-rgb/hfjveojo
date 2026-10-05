"use client";

import Image from "next/image";
import { useState } from "react";
import type { RoomExample } from "@/content/room-examples";

/**
 * "What each room looks like staged": the empty photo and the staged result of one room side by side (stacked on a
 * phone), picked with the thumbnails. Only the chosen pair loads at full size.
 */
export function RoomGallery({ rooms }: { rooms: RoomExample[] }) {
  const [active, setActive] = useState(0);
  const room = rooms[active];
  return (
    <div className="not-prose my-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { image: room.before, chip: "Empty, as photographed" },
          { image: room.after, chip: `Virtually staged · ${room.style}` },
        ].map(({ image, chip }) => (
          <figure key={image.src} className="relative overflow-hidden rounded-xl border border-line bg-card-2">
            <Image src={image.src} alt={image.alt} width={image.width} height={image.height} unoptimized className="h-auto w-full" />
            <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">{chip}</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-sm text-gray-600">
        <strong className="text-fg">{room.label}.</strong> Added: {room.added}. Kept: {room.kept}.
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label="Choose a room">
        {rooms.map((r, i) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`overflow-hidden rounded-lg border text-left transition ${i === active ? "border-accent ring-2 ring-accent/40" : "border-line hover:border-accent/60"}`}
          >
            <Image src={r.thumb} alt="" width={240} height={160} unoptimized className="h-auto w-full" />
            <span className={`block truncate px-1 py-1 text-[10px] font-semibold sm:px-1.5 sm:text-xs ${i === active ? "text-accent" : "text-gray-700"}`}>{r.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
