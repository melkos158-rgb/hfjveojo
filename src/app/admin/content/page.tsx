import { prisma } from "@/lib/db";
import { outreachTemplates } from "@/content/outreach";
import { generateContentAction } from "@/app/admin/content/actions";

export const dynamic = "force-dynamic";

export default async function AdminContent() {
  const latest = await prisma.setting.findUnique({ where: { key: "content.latest" } });
  const drafts = (latest?.value as { vertical?: string; createdAt?: string; text?: string } | null) ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Content engine</h1>
        <p className="mt-1 text-sm text-gray-600">Outreach that sounds like a person, plus AI-drafted posts in the Before → ORVIONIS → After frame. Nothing here claims numbers we don&apos;t have.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Outreach templates</h2>
        {outreachTemplates.map((t) => (
          <details key={t.key} className="card">
            <summary className="cursor-pointer font-semibold">
              {t.key} — {t.channel}
            </summary>
            <p className="mt-1 text-xs text-gray-500">{t.when}</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">📤 EN — send as is</div>
                <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-mist p-3 text-sm">{t.en}</pre>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">🇺🇦 UA — control translation</div>
                <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-mist p-3 text-sm">{t.ua}</pre>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">✍️ Personalise: {t.personalize}</p>
          </details>
        ))}
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Draft posts (AI, cheap tier)</h2>
        <form action={generateContentAction} className="flex flex-wrap items-center gap-2">
          <select name="vertical" className="field-input w-auto" defaultValue="real-estate">
            <option value="real-estate">Real estate — Listing Clips</option>
            <option value="photography">Photographers — Pricing Guide</option>
          </select>
          <input name="angle" className="field-input w-72" placeholder="Angle (optional), e.g. 'open house weekend'" />
          <button className="btn-primary px-4 py-2" type="submit">
            Generate 3 drafts
          </button>
        </form>
        {drafts?.text ? (
          <div>
            <div className="text-xs text-gray-500">
              {drafts.vertical} · {drafts.createdAt}
            </div>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-mist p-3 text-sm">{drafts.text}</pre>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No drafts yet.</p>
        )}
      </section>
    </div>
  );
}
