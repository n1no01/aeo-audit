import { SignIn } from "@clerk/nextjs";

interface SignInPageProps {
  searchParams: Promise<{
    redirect_url?: string;
    redirectUrl?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  // Čitamo parametar iz URL-a (pokrivamo i sa donjom crtom i camelCase)
  const targetUrl = params.redirect_url || params.redirectUrl || "/dashboard";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <SignIn forceRedirectUrl={targetUrl} />
    </div>
  );
}