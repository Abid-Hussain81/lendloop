import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Flower2,
  Hammer,
  Handshake,
  Repeat2,
  Tent,
  Utensils,
} from "lucide-react";
import { PublicTools } from "@/components/public-tools";
import { isConfigured } from "@/lib/config";
export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> THE NEIGHBORHOOD TOOL LIBRARY
          </p>
          <h1>
            Good tools.
            <br />
            <em>Better neighbors.</em>
          </h1>
          <p className="hero-description">
            Borrow what you need. Lend what you don’t.
            <br />
            Make a little room for sharing.
          </p>
          <div className="hero-actions">
            <Link href="/sign-in" className="button">
              Sign in to lend or borrow <ArrowUpRight size={18} />
            </Link>
            <a className="text-link" href="#available">
              Explore the library <ArrowDown size={16} />
            </a>
          </div>
          <p className="hero-note">
            <Handshake size={16} /> Less buying. More belonging.
          </p>
        </div>
        <div className="sharing-illustration" aria-hidden="true">
          <span className="illustration-label">SOMETHING USEFUL, SHARED.</span>
          <div className="orbit">
            <div className="orbit-center">
              <Repeat2 size={46} strokeWidth={1.2} />
            </div>
            <div className="orbit-icon hammer">
              <Hammer size={45} strokeWidth={1.25} />
            </div>
            <div className="orbit-icon flower">
              <Flower2 size={45} strokeWidth={1.25} />
            </div>
            <div className="orbit-icon tent">
              <Tent size={45} strokeWidth={1.25} />
            </div>
            <div className="orbit-icon kitchen">
              <Utensils size={40} strokeWidth={1.25} />
            </div>
          </div>
          <p>
            One neighborhood.
            <br />
            <em>So many possibilities.</em>
          </p>
          <span className="illustration-corner">↗</span>
        </div>
      </section>
      <section id="available" className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">USE IT. RETURN IT. KEEP IT GOING.</p>
            <h2>What’s in the neighborhood?</h2>
          </div>
          <span className="quiet-tag">Available to borrow</span>
        </div>
        <PublicTools configured={isConfigured()} />
        <p className="catalog-note">
          Sign in to see details and request a tool. Your neighbors’ information
          stays private.
        </p>
      </section>
      <section id="how-it-works" className="how-section">
        <div>
          <p className="eyebrow">A SIMPLE KIND OF CIRCULAR</p>
          <h2>
            Good things
            <br />
            <em>come around.</em>
          </h2>
        </div>
        <ol className="steps">
          <li>
            <span>01</span>
            <div>
              <h3>Find your next helping hand.</h3>
              <p>
                Browse tools in your neighborhood and choose the dates you need.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Ask. Agree. Get to work.</h3>
              <p>
                Send a request. Your neighbor approves the dates before the loan
                is confirmed.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Return it. Pass it on.</h3>
              <p>Mark the tool returned so it’s ready for the next project.</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
