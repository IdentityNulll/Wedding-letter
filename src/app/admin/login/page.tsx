import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-stone-100 px-5">
      <LoginForm />
    </main>
  );
}
