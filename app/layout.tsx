import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { isConfigured } from "@/lib/config";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "LendLoop — Good tools. Better neighbors.",
    template: "%s · LendLoop",
  },
  description:
    "Borrow what you need. Lend what you don't. A neighborhood tool library.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const configured = isConfigured();
  return (
    <html lang="en">
      <body>
        <Providers configured={configured}>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header configured={configured} />
          <main id="main">{children}</main>
          <footer className="site-footer container">
            <span>LendLoop. A little more shared.</span>
            <span>Made for good neighbors.</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
