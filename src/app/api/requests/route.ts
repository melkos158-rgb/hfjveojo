import { z } from "zod";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { track } from "@/lib/analytics/events";
import { notifyAdmins } from "@/lib/orders/service";
import { ipHash, rateLimit } from "@/lib/security/ratelimit";

const PROFESSIONS = ["real-estate", "photography", "contractor", "other"] as const;

const schema = z.object({
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  profession: z.enum(PROFESSIONS),
  need: z.string().trim().min(8).max(2000),
  topic: z.string().trim().max(60).optional(),
  // honeypot — bots fill it, people never see it
  website: z.string().max(0).optional(),
});

/**
 * "Tell us what you need" — demand capture for tools that do not exist yet. Stored as Feedback(source=tool_request)
 * so it shows up in /admin/feedback next to order feedback, and counted as an event for /admin/analytics.
 */
export async function POST(req: Request) {
  try {
    await rateLimit({ key: `requests:${ipHash(req)}`, limit: 5, windowSeconds: 3600 });
    const body = schema.parse(await req.json());
    const tags = [body.profession, ...(body.topic ? [body.topic.slice(0, 60)] : [])];
    await prisma.feedback.create({
      data: { email: body.email || null, text: body.need, tags, source: "tool_request" },
    });
    await track("tool_request", { props: { profession: body.profession, topic: body.topic ?? null, hasEmail: Boolean(body.email) }, ipHash: ipHash(req), userAgent: req.headers.get("user-agent") });
    await notifyAdmins(`Tool request (${body.profession})`, `${body.need}\n\nEmail: ${body.email || "-"}\nTopic: ${body.topic ?? "-"}`);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: "Tell us in a sentence or two what you need (and a valid email if you want a reply)." }, { status: 400 });
    return errorResponse(err);
  }
}
