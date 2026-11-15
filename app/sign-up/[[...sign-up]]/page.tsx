import { SignUp } from "@clerk/nextjs";
import { SetupNotice } from "@/components/setup-notice";
import { isConfigured } from "@/lib/config";
export default function SignUpPage() {
  return isConfigured() ? (
    <div className="auth-page">
      <SignUp />
    </div>
  ) : (
    <SetupNotice />
  );
}
