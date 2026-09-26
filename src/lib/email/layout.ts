import { appUrl } from "@/lib/env";
import { site } from "@/config/site";
import { brand } from "@/config/brand";

export const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const linkify = (line: string) => escapeHtml(line).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`);

/** Plain-text email body → safe HTML (escaped, links clickable, line breaks kept). */
export function textToHtml(text: string): string {
  return `<p>${text.split("\n").map(linkify).join("<br/>")}</p>`;
}

/**
 * Every HTML email goes out in the same frame: the official ORVIONIS mark and name on the brand background, the
 * message, and a footer with the site and support address. Table layout and inline styles for email clients; the
 * mark is an absolute URL (clients that block images still show the name next to it).
 */
export function brandedEmailHtml(inner: string): string {
  const host = site.url.replace(/^https?:\/\//, "");
  return [
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"></head>`,
    `<body style="margin:0;padding:0;background:#f4f4f6;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:24px 12px;"><tr><td align="center">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">`,
    `<tr><td style="background:${brand.colors.background};padding:14px 24px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>`,
    `<td style="vertical-align:middle;"><img src="${appUrl(brand.mark[96])}" width="32" height="32" alt="" style="display:block;border:0;"></td>`,
    `<td style="vertical-align:middle;padding-left:10px;color:#f5f5f7;font-size:16px;font-weight:800;letter-spacing:2px;">${escapeHtml(site.name)}</td>`,
    `</tr></table></td></tr>`,
    `<tr><td style="padding:24px;font-size:15px;line-height:1.55;">${inner}</td></tr>`,
    `<tr><td style="padding:14px 24px;border-top:1px solid #eeeef2;font-size:12px;line-height:1.5;color:#71717a;">${escapeHtml(site.name)} · <a href="${site.url}" style="color:#7c3aed;">${escapeHtml(host)}</a> · <a href="mailto:${site.supportEmail}" style="color:#7c3aed;">${escapeHtml(site.supportEmail)}</a></td></tr>`,
    `</table></td></tr></table></body></html>`,
  ].join("");
}
