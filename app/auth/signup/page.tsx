import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { SignupForm } from "@/components/auth/signup-form";
import { getI18n } from "@/src/i18n";

export default async function SignupPage() {
  const messages = await getI18n();
  const page = messages.auth.signupPage;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <AuthCard
        title={page.title}
        description={page.description}
        sideTitle={page.sideTitle}
        sideDescription={page.sideDescription}
        sideHighlights={page.sideHighlights}
      >
        <SignupForm labels={messages.auth.signupForm} />
        <div className="mt-5">
          <AuthLinks
            text={page.switchText}
            linkText={page.switchLinkText}
            href="/auth/login"
          />
        </div>
      </AuthCard>
    </main>
  );
}
