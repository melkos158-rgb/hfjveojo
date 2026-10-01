import Image from "next/image";
import type { HeroImage } from "@/lib/tools/types";

/**
 * First-screen proof on a photo tool: the real "after" large, the "before" inset in the corner. Both are the sample's
 * real files (the pipeline's unedited output), never a mock-up. Static: no script, nothing loads late.
 */
export function HeroResult({ hero }: { hero: { before: HeroImage; after: HeroImage; caption: string } }) {
  return (
    <figure>
      <div className="relative pb-7 sm:pb-9">
        <div className="glow relative overflow-hidden rounded-3xl border border-line bg-card">
          <Image
            src={hero.after.src}
            alt={hero.after.alt}
            width={hero.after.width}
            height={hero.after.height}
            priority
            unoptimized
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="h-auto w-full"
          />
          <span className="absolute top-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">After</span>
          <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">Real result · not retouched</span>
        </div>
        <div className="absolute bottom-0 left-3 w-[38%] overflow-hidden rounded-xl border-2 border-white bg-card shadow-lg sm:left-5">
          <Image src={hero.before.src} alt={hero.before.alt} width={hero.before.width} height={hero.before.height} unoptimized className="h-auto w-full" />
          <span className="absolute top-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">Before</span>
        </div>
      </div>
      <figcaption className="mt-3 hidden text-xs text-gray-500 sm:block">{hero.caption}</figcaption>
    </figure>
  );
}
