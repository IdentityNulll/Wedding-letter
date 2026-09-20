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

/** Allowed browser origins, comma separated. Trailing slashes are stripped on
 *  both sides: CLIENT_ORIGIN is usually pasted from a browser bar with a "/",
 *  but the Origin header never has one, and a literal compare silently fails
 *  every preflight with no clue why. */
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.includes("*");

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header: curl, server-to-server, or same-origin. Not a
      // browser cross-origin request, so there is nothing to police.
      if (!origin || allowAllOrigins) return cb(null, true);

      if (allowedOrigins.includes(origin.replace(/\/+$/, ""))) return cb(null, true);

      // Refusing without an error keeps this a clean browser-side CORS block
      // rather than a 500, and the log names both sides of the mismatch.
      console.warn(
        `[cors] blocked "${origin}" — CLIENT_ORIGIN allows: ${allowedOrigins.join(", ") || "(none)"}`,
      );
      cb(null, false);
    },
  }),
);
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
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
      // Printed every boot so a CORS failure can be diagnosed from the deploy
      // log alone, without guessing at what the variable actually contains.
      console.log(`CORS allowed origins: ${allowedOrigins.join(", ") || "(none)"}`);
    });
  })
  .catch((err) => {
    console.error("\nCould not start: " + err.message + "\n");
    process.exit(1);
  });
