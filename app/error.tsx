"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="setup-state container">
      <h1>We couldn’t load the library.</h1>
      <p>Please check your connection and try again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
