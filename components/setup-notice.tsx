import Link from "next/link";
import { Sprout } from "lucide-react";
export function SetupNotice() {
  return (
    <section className="setup-state container">
      <Sprout size={38} strokeWidth={1.3} />
      <p className="eyebrow">A NEIGHBORHOOD IN THE MAKING</p>
      <h1>The library is getting ready.</h1>
      <p>
        Sign-in and the shared tool library will be available once setup is
        complete.
      </p>
      <Link className="button" href="/">
        Back to LendLoop
      </Link>
    </section>
  );
}
