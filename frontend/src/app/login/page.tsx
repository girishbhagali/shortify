import SignInPageClient from "./SignInPageClient";

type LoginPageProps = {
  searchParams: Promise<{
    auth_error?: string;
    redirect?: string;
  }>;
};

export default async function SignInPage({ searchParams }: LoginPageProps) {
  const { auth_error: authError, redirect } = await searchParams;

  return (
    <SignInPageClient
      authError={authError}
      redirectTo={redirect}
    />
  );
}
