import type { Handler } from "../types.js";

interface Envelope {
  report?: { description?: string };
  page?: { url?: string; route?: string | null };
  target?: { tag?: string; primarySelector?: string; text?: string };
  client?: { userAgent?: string };
}

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Chain handler: post the report to a Discord webhook as an embed, with the
 * screenshot attached inline. `import { discord } from "@tracepoint-dev/webhook-kit/connectors"`.
 */
export function discord(webhookUrl: string | undefined): Handler {
  return async (report, ctx) => {
    if (!webhookUrl) return;
    const p = report.payload as Envelope;
    const description = (p.report?.description || "(no description)").slice(0, 2000);

    const fields: EmbedField[] = [];
    if (p.page?.route) fields.push({ name: "Route", value: String(p.page.route), inline: true });
    if (p.target?.tag) {
      fields.push({
        name: "Element",
        value: `\`${p.target.primarySelector ?? p.target.tag}\``,
        inline: true,
      });
    }
    if (p.client?.userAgent) {
      fields.push({ name: "Browser", value: String(p.client.userAgent).slice(0, 200) });
    }

    const embed = {
      title: "New Tracepoint report",
      description,
      url: p.page?.url,
      timestamp: report.createdAt,
      fields,
      ...(report.screenshot ? { image: { url: "attachment://screenshot.png" } } : {}),
    };

    const form = new FormData();
    form.append("payload_json", JSON.stringify({ embeds: [embed] }));

    if (report.screenshot) {
      const shot = await ctx.readScreenshot();
      if (shot) {
        form.append("files[0]", new Blob([shot.bytes], { type: shot.mimeType }), "screenshot.png");
      }
    }

    const res = await fetch(webhookUrl, { method: "POST", body: form });
    if (!res.ok) throw new Error(`discord webhook responded ${res.status}`);
  };
}
