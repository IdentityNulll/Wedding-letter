/** In dev, Vite proxies /api to the Express server, so this is empty and every
 *  request is same-origin. In production set VITE_API_URL to the API's origin. */
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const TOKEN_KEY = "wl_token";

export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY) || "",
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Resolve an uploaded file path against the API origin. */
export function mediaUrl(p) {
  if (!p) return "";
  return /^https?:\/\//.test(p) ? p : `${BASE}${p}`;
}

export function qrUrl(slug, format) {
  return `${BASE}/api/qr/${slug}?format=${format}`;
}

/** A dead API is the single most common failure in development, and it surfaces
 *  as an opaque 500 from the Vite proxy (or a thrown TypeError in production).
 *  Neither tells you the real problem, so both are translated here. */
const API_DOWN = "Server bilan bog'lanib bo'lmadi. API ishga tushganini tekshiring.";

async function request(path, { method = "GET", body, authed = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authed) headers.Authorization = `Bearer ${auth.get()}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects on a network-level failure — the API is unreachable.
    throw Object.assign(new Error(API_DOWN), { status: 0 });
  }

  // An expired or missing token should bounce to login rather than surface a
  // confusing error deep inside a form.
  if (res.status === 401 && authed) {
    auth.clear();
    if (!location.pathname.startsWith("/admin/login")) location.href = "/admin/login";
    throw new Error("unauthorized");
  }

  // A proxy that cannot reach the API answers 502/504 — and Vite answers 500
  // with an HTML body, so there is no JSON `error` to read.
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || (res.status >= 500 ? API_DOWN : `HTTP ${res.status}`);
    throw Object.assign(new Error(message), { status: res.status });
  }
  return data;
}

export const api = {
  login: (password) => request("/auth/login", { method: "POST", body: { password } }),

  getPublic: (slug) => request(`/public/${slug}`),
  postMessage: (slug, body) => request(`/public/${slug}/messages`, { method: "POST", body }),

  list: () => request("/invitations", { authed: true }),
  create: () => request("/invitations", { method: "POST", authed: true }),
  get: (id) => request(`/invitations/${id}`, { authed: true }),
  update: (id, body) => request(`/invitations/${id}`, { method: "PUT", body, authed: true }),
  remove: (id) => request(`/invitations/${id}`, { method: "DELETE", authed: true }),

  hideMessage: (id, hidden) =>
    request(`/invitations/messages/${id}`, { method: "PATCH", body: { hidden }, authed: true }),
  deleteMessage: (id) => request(`/invitations/messages/${id}`, { method: "DELETE", authed: true }),

  geocode: (q) => request(`/geocode?q=${encodeURIComponent(q)}`, { authed: true }),

  async upload(files) {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch(`${BASE}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.get()}` },
      body: fd, // no Content-Type: the browser must set the multipart boundary
    });
    if (!res.ok) throw new Error("upload failed");
    return res.json();
  },
};
