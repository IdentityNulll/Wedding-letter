import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
// Patches Express 4 so a rejected promise in an async route reaches the error
// handler below instead of hanging the request forever. Must precede `express`.
import "express-async-errors";
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import invitationRoutes from "./routes/invitations.js";
import mediaRoutes from "./routes/media.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind Caddy/nginx, so req.ip is the real visitor — the guestbook rate
// limiter depends on this being right.
app.set("trust proxy", 1);

const origins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: origins.includes("*") ? true : origins }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"), { maxAge: "30d" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api", mediaRoutes);

/* ── Serve the built client, if it has been built ───────────────────────
   Optional: in development you run Vite separately on :5173. But for a
   single-origin production deploy this makes the API serve the SPA too, which
   removes two whole classes of problem:

     · MIME types — express.static sets text/javascript for .js. Opening
       dist/index.html straight off disk, or serving it with a static server
       that does not know the extension, hands the browser
       application/octet-stream and every module script is rejected.
     · Deep links — /azizbek-nargiza is a client route with no file behind it,
       so without the fallback below it 404s on refresh.                       */
const clientDist = path.join(__dirname, "..", "..", "client", "dist");

if (fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));

  app.get("*", (req, res, next) => {
    // Never swallow the API or uploads — they must keep their real responses.
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((_req, res) => res.status(404).json({ error: "not found" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "server error" });
});

const PORT = Number(process.env.PORT || 4000);

connectDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("\nCould not start: " + err.message + "\n");
    process.exit(1);
  });
