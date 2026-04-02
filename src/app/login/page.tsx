import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect?.startsWith("/") ? params.redirect : "/";

  return (
    <main className="min-h-screen px-6 py-16 text-[var(--text-primary)]">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
