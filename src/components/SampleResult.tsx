import Image from "next/image";
import type { SampleBlock, SampleResult as SampleResultData } from "@/lib/tools/types";

function Block({ block }: { block: SampleBlock }) {
  return (
    <div>
      {block.heading ? <h3 className="text-sm font-semibold text-fg">{block.heading}</h3> : null}
      {block.text
        ? block.text.split("\n\n").map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-gray-700">
              {p}
            </p>
          ))
        : null}
      {block.bullets?.length ? (
        <ul className="mt-2 space-y-1.5">
          {block.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm leading-relaxed text-gray-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * "Example result" section on a tool page: the fictional input on the left, the finished deliverable on the
 * right, exactly as it is delivered. Static content — no AI call, nothing invented at request time.
 */
export function SampleResult({ sample, toolName }: { sample: SampleResultData; toolName: string }) {
  const cut = sample.collapseAfter ?? sample.output.length;
  const visible = sample.output.slice(0, cut);
  const rest = sample.output.slice(cut);
  return (
    <section id="example" className="border-y border-line bg-mist scroll-mt-20">
      <div className="container-x py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Example result</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">What you get — before you pay</h2>
          </div>
          <p className="max-w-md text-sm text-gray-500">
            {sample.label}. {sample.caption ?? "Built from fictional facts so you can judge the format and the writing; your order uses your details."}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="card h-fit">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">You send</div>
              <span className="badge bg-gray-100 text-gray-700">Example input</span>
            </div>
            <ul className="mt-4 space-y-2">
              {sample.input.map((line) => (
                <li key={line} className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-gray-700">
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">You get</div>
              <span className="badge bg-accent-soft text-accent">{toolName}</span>
            </div>
            {sample.preview ? (
              <div className="mt-4">
                <div className="overflow-hidden rounded-xl border border-line bg-card-2">
                  <Image src={sample.preview.image} alt={sample.preview.alt} width={sample.preview.width} height={sample.preview.height} unoptimized className="h-auto w-full" />
                </div>
                {sample.preview.href ? (
                  <a href={sample.preview.href} target="_blank" rel="noopener" className="btn-secondary mt-3">
                    {sample.preview.downloadLabel ?? "Open the sample"}
                  </a>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 space-y-5">
              {visible.map((b, i) => (
                <Block key={i} block={b} />
              ))}
            </div>
            {rest.length ? (
              <details className="mt-5 rounded-lg border border-line bg-bg p-3">
                <summary className="cursor-pointer text-sm font-semibold text-fg">Show the rest of the sample ({rest.length} more sections)</summary>
                <div className="mt-4 space-y-5">
                  {rest.map((b, i) => (
                    <Block key={i} block={b} />
                  ))}
                </div>
              </details>
            ) : null}
            {sample.note ? <p className="mt-5 border-t border-line pt-4 text-xs text-gray-500">{sample.note}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
