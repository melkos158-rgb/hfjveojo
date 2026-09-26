import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { signedFileUrl } from "@/lib/storage";
import { originalPhotoFor } from "@/lib/orders/original-photo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Original photo", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

/**
 * Public page with the unaltered original of a virtually staged listing photo — the "link or QR code to the
 * original" that California AB 723 and many MLS rules ask for next to digitally altered images.
 */
export default async function OriginalPhotoPage({ params }: Props) {
  const { token } = await params;
  const found = await originalPhotoFor(token);
  if (!found) notFound();
  return (
    <div className="container-x max-w-4xl py-12">
      <p className="eyebrow">Unaltered original</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Original photo</h1>
      <p className="mt-3 max-w-2xl text-gray-700">
        Listing photos of {found.photos.length > 1 ? "these rooms" : "this room"} were virtually staged — digitally altered images with furniture and decor added. {found.photos.length > 1 ? "These are the photos" : "This is the photo"} as taken, without any added items.
      </p>
      {found.photos.length === 0 ? <p className="mt-6 text-sm text-gray-700">No photos on this order.</p> : null}
      {found.photos.map((p, i) => (
        <figure key={`${p.label}-${i}`} className="mt-6">
          {found.photos.length > 1 ? <figcaption className="mb-2 text-sm font-semibold text-gray-600">{p.label}</figcaption> : null}
          {p.fileId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedFileUrl(p.fileId, 3600)} alt={`Original, unaltered photo — ${p.label}`} className="h-auto w-full rounded-xl border border-line" />
          ) : (
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">This original photo is no longer stored (files are kept for 90 days after delivery).</p>
          )}
        </figure>
      ))}
    </div>
  );
}
