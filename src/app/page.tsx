import Link from "next/link";
import { Divider } from "@/components/Ornament";

export default function Home() {
  return (
    <main data-theme="zar" className="parchment flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-5xl sm:text-6xl">
        <span className="foil">Taklifnoma</span>
      </h1>
      <Divider className="my-6" />
      <p className="max-w-sm text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        Onlayn to&apos;y taklifnomalari.
      </p>
      <Link
        href="/admin"
        className="frame mt-9 min-h-11 px-7 py-3 text-xs tracking-[0.25em] uppercase transition hover:opacity-80"
        style={{ color: "var(--accent-deep)" }}
      >
        Admin panel
      </Link>
    </main>
  );
}
