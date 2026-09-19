import QRCode from "qrcode";
import { getBySlug } from "@/lib/db";
import { siteUrl } from "@/lib/site";

/** QR for an invitation.
 *
 *  ?format=svg  → vector, for handing to a printer (default)
 *  ?format=png  → 1400px raster, for Telegram / quick previews
 *
 *  Error correction is fixed at H (30% recoverable) because these get printed
 *  on textured card stock and often have an ornament dropped in the middle. */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const inv = getBySlug(slug);
  if (!inv) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  const dark = url.searchParams.get("dark") ?? "#000000";
  const target = `${siteUrl()}/${inv.slug}`;

  const opts = {
    errorCorrectionLevel: "H" as const,
    margin: 2,
    color: { dark, light: "#FFFFFF" },
  };

  if (format === "png") {
    const buf = await QRCode.toBuffer(target, { ...opts, type: "png", width: 1400 });
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${inv.slug}-qr.png"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const svg = await QRCode.toString(target, { ...opts, type: "svg", width: 1024 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
