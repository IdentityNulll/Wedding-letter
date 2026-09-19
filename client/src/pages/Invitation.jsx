import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import InvitationView from "../components/InvitationView";

export default function Invitation() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let alive = true;
    api.getPublic(slug)
      .then((d) => alive && setState({ status: "ok", ...d }))
      .catch(() => alive && setState({ status: "missing" }));
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (state.status !== "ok") return;
    const names = [state.invitation.groomName, state.invitation.brideName].filter(Boolean).join(" & ");
    document.title = names ? `${names} — Taklifnoma` : "Taklifnoma";
  }, [state]);

  if (state.status === "loading") {
    return <div data-theme="zar" className="desk flex items-center justify-center" />;
  }

  if (state.status === "missing") {
    return (
      <div data-theme="zar" className="desk flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-3xl" style={{ color: "var(--gold)" }}>Taklifnoma topilmadi</p>
        <p className="mt-2 text-sm" style={{ color: "var(--envelope-2)" }}>
          Havolani tekshirib qayta urinib ko&apos;ring.
        </p>
      </div>
    );
  }

  return <InvitationView inv={state.invitation} messages={state.messages} />;
}
