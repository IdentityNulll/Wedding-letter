"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Field groups the inline editor can open. One group ≈ one bottom sheet. */
export type EditGroup =
  | "names"
  | "epigraph"
  | "date"
  | "greeting"
  | "venue"
  | "schedule"
  | "contacts"
  | "gallery"
  | "gift"
  | "music"
  | "hero"
  | "theme";

type EditApi = { active: boolean; open: (g: EditGroup) => void };

const Ctx = createContext<EditApi>({ active: false, open: () => {} });

export function EditProvider({ open, children }: { open: (g: EditGroup) => void; children: ReactNode }) {
  return <Ctx.Provider value={{ active: true, open }}>{children}</Ctx.Provider>;
}

export function useEdit() {
  return useContext(Ctx);
}

/** Wraps an editable region. On the public page there is no provider, so this
 *  renders its children untouched and costs nothing. In the admin it adds a
 *  dashed hit area and a pencil button. */
export function Edit({
  group,
  label,
  children,
}: {
  group: EditGroup;
  label: string;
  children: ReactNode;
}) {
  const { active, open } = useEdit();
  if (!active) return <>{children}</>;

  return (
    <div className="relative rounded-sm outline-dashed outline-1 outline-offset-4 outline-transparent transition-[outline-color] hover:outline-current" style={{ color: "var(--accent)" }}>
      <div style={{ color: "var(--ink)" }}>{children}</div>
      <button
        type="button"
        onClick={() => open(group)}
        aria-label={`${label} — tahrirlash`}
        title={label}
        className="absolute -top-3 -right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full text-sm shadow-md transition hover:scale-110"
        style={{ background: "var(--accent)", color: "var(--paper)" }}
      >
        ✎
      </button>
    </div>
  );
}
