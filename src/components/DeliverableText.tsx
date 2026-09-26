import { markdownSections, type Inline } from "@/lib/markdown";
import { CopyButton } from "@/components/CopyButton";

function Inlines({ xs }: { xs: Inline[] }) {
  return (
    <>
      {xs.map((x, i) =>
        x.t === "bold" ? (
          <strong key={i} className="font-semibold text-fg">
            {x.v}
          </strong>
        ) : x.t === "em" ? (
          <em key={i}>{x.v}</em>
        ) : (
          <span key={i}>{x.v}</span>
        ),
      )}
    </>
  );
}

/** The delivered text, rendered from our Markdown subset with a copy button per section. */
export function DeliverableText({ markdown, title }: { markdown: string; title?: string }) {
  const sections = markdownSections(markdown);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title ?? "Your text"}</h2>
        <CopyButton text={markdown} label="Copy everything" />
      </div>
      {sections.map((s, idx) => (
        <section key={idx} className="rounded-xl border border-line bg-card p-4">
          {s.title ? (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-fg">{s.title}</h3>
              {s.plain ? <CopyButton text={s.plain} /> : null}
            </div>
          ) : null}
          <div className="space-y-3 text-sm leading-relaxed text-gray-700">
            {s.blocks.map((b, i) => {
              if (b.kind === "heading")
                return b.level === 1 ? (
                  <h2 key={i} className="text-xl font-bold text-fg">
                    {b.text}
                  </h2>
                ) : (
                  <h4 key={i} className="font-semibold text-fg">
                    {b.text}
                  </h4>
                );
              if (b.kind === "paragraph")
                return (
                  <p key={i}>
                    <Inlines xs={b.inlines} />
                  </p>
                );
              if (b.kind === "bullets")
                return (
                  <ul key={i} className="list-disc space-y-1 pl-5">
                    {b.items.map((it, j) => (
                      <li key={j}>
                        <Inlines xs={it} />
                      </li>
                    ))}
                  </ul>
                );
              return (
                <ol key={i} className="list-decimal space-y-1 pl-5">
                  {b.items.map((it, j) => (
                    <li key={j}>
                      <Inlines xs={it} />
                    </li>
                  ))}
                </ol>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
