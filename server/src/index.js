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
