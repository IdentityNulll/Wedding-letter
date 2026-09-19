import { notFound, redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getById, listAllMessages } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import InlineEditor from "@/components/admin/InlineEditor";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const id = Number((await params).id);
  const inv = Number.isFinite(id) ? getById(id) : null;
  if (!inv) notFound();

  return <InlineEditor invitation={inv} messages={listAllMessages(inv.id)} origin={siteUrl()} />;
}
