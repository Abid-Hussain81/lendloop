import { SignIn } from "@clerk/nextjs";
import { SetupNotice } from "@/components/setup-notice";
import { isConfigured } from "@/lib/config";
export default function SignInPage() {
  return isConfigured() ? (
    <div className="auth-page">
      <SignIn />
    </div>
  ) : (
    <SetupNotice />
  );
}
