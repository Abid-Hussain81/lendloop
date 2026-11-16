import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Hammer,
  Sprout,
  Tent,
  Utensils,
  ArrowRight,
} from "lucide-react";
import { PublicTools } from "@/components/public-tools";
import { WorkshopIllustration } from "@/components/workshop-illustration";
import { isConfigured } from "@/lib/config";

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-rule" /> YOUR NEIGHBORHOOD TOOL LIBRARY
          </p>
          <h1>
            The right tool.
            <br />
            <span>Already nearby.</span>
          </h1>
          <p className="hero-description">
            For the job you’ve been putting off, or the project you can’t wait
            to start. Borrow from a neighbor. Put your own tools to good use.
          </p>
          <div className="hero-actions">
            <Link href="/sign-in" className="button">
              Sign in to lend or borrow <ArrowUpRight size={17} />
            </Link>
            <a className="text-link" href="#available">
              Explore the library <ArrowDown size={16} />
            </a>
          </div>
          <p className="hero-note">
            <Check size={15} /> Pick your dates. Your neighbor confirms.
          </p>
        </div>
        <WorkshopIllustration />
      </section>
      <div className="category-strip" aria-label="Tool categories">
        <span className="category-strip-label">A TOOL FOR EVERY PROJECT</span>
        <span>
          <Hammer size={18} /> Power tools
        </span>
        <span>
          <Sprout size={18} /> Garden
        </span>
        <span>
          <Utensils size={18} /> Kitchen
        </span>
        <span>
          <Tent size={18} /> Camping
        </span>
      </div>
      <section id="available" className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE NEIGHBORHOOD COLLECTION</p>
            <h2>Find what you need.</h2>
          </div>
          <span className="quiet-tag">
            <span className="live-dot" /> Available to borrow
          </span>
        </div>
        <PublicTools configured={isConfigured()} />
        <p className="catalog-note">
          Sign in for tool details and borrowing dates. Owner information stays
          private.
        </p>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">HOW LENDLOOP WORKS</p>
            <h2>From their shed to your next project.</h2>
          </div>
          <Link className="text-link" href="/sign-up">
            Join the neighborhood <ArrowRight size={16} />
          </Link>
        </div>
        <ol className="steps">
          <li>
            <span>01</span>
            <div>
              <h3>Find the right tool</h3>
              <p>
                Browse the library, check the details, and choose the dates you
                need.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Make a request</h3>
              <p>
                Your neighbor approves the dates before the loan is confirmed.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Return it, ready for the next job</h3>
              <p>Mark it returned and keep something useful in circulation.</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
