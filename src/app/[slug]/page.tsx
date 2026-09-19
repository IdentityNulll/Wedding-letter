import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBySlug, listMessages } from "@/lib/db";
import InvitationView from "@/components/invitation/InvitationView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inv = getBySlug((await params).slug);
  if (!inv) return { title: "Taklifnoma" };
  const names = [inv.groomName, inv.brideName].filter(Boolean).join(" & ");
  return {
    title: names ? `${names} — Taklifnoma` : "Taklifnoma",
    description: [inv.greetingTitle, inv.venueName].filter(Boolean).join(" · "),
    openGraph: {
      title: names,
      description: inv.venueName,
      images: inv.heroImage ? [inv.heroImage] : undefined,
    },
  };
}

export default async function InvitationPage({ params }: Props) {
  const inv = getBySlug((await params).slug);
  if (!inv || !inv.published) notFound();

  const messages = inv.showGuestbook === 1 ? listMessages(inv.id) : [];
  return <InvitationView inv={inv} messages={messages} />;
}
