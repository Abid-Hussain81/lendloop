import Link from "next/link";
export default function NotFound() {
  return (
    <section className="setup-state container">
      <h1>This path ends here.</h1>
      <p>Let’s get you back to the neighborhood.</p>
      <Link className="button" href="/">
        Go home
      </Link>
    </section>
  );
}
