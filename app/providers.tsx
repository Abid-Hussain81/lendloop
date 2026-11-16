"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useState } from "react";

function Connected({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
  );
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
export function Providers({
  children,
  configured,
}: {
  children: React.ReactNode;
  configured: boolean;
}) {
  if (!configured) return children;
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      localization={{
        signIn: {
          start: {
            title: "Sign in to LendLoop",
            titleCombined: "Sign in to LendLoop",
            subtitle: "Your neighborhood tool library.",
          },
        },
        signUp: {
          start: {
            title: "Join LendLoop",
            subtitle: "Borrow what you need. Share what you have.",
          },
        },
      }}
      appearance={{
        variables: {
          colorPrimary: "#B94F2D",
          colorForeground: "#222725",
          colorMutedForeground: "#626761",
          colorBackground: "#FFFFFF",
          colorInput: "#FFFFFF",
          colorInputForeground: "#222725",
          borderRadius: "8px",
          fontFamily: '"Segoe UI", Arial, sans-serif',
        },
        elements: {
          cardBox: "lendloop-auth-card",
          formButtonPrimary: "lendloop-auth-primary",
          headerTitle: "lendloop-auth-title",
        },
      }}
    >
      <Connected>{children}</Connected>
    </ClerkProvider>
  );
}
