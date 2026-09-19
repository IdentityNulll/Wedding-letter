/** Public origin of the deployment, with no trailing slash.
 *  Used for QR targets and copy-to-clipboard links, so it must be the address
 *  a guest's phone can actually reach — not localhost, in production. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
