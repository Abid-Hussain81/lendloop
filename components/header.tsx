"use client";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { ArrowUpRight, Repeat2 } from "lucide-react";
function Account() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <span className="muted small">One moment…</span>;
  return isSignedIn ? (
    <div className="account">
      <Link className="nav-link" href="/dashboard">
        My neighborhood <ArrowUpRight size={15} />
      </Link>
      <UserButton />
    </div>
  ) : (
    <Link className="button small-button" href="/sign-in">
      Sign in <ArrowUpRight size={15} />
    </Link>
  );
}
export function Header({ configured }: { configured: boolean }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="wordmark" aria-label="LendLoop home">
          <span className="brand-mark">
            <Repeat2 size={22} />
          </span>
          LendLoop<span className="wordmark-dot">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link className="nav-link how-link" href="/#how-it-works">
            How it works
          </Link>
          {configured ? (
            <Account />
          ) : (
            <Link className="button small-button" href="/sign-in">
              Sign in <ArrowUpRight size={15} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
