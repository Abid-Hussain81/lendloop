"use client";
import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Plus,
  BadgeCheck,
  Pencil,
  Trash2,
  ArrowUpRight,
  Wrench,
  Package,
  Inbox,
  CalendarDays,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { categories } from "@/lib/catalog";
import { errorMessage } from "@/lib/errors";
import { ToolForm, type ToolFields } from "./tool-form";
import { ToolCard } from "./tool-card";
import { LoanCard } from "./loan-card";

export function Dashboard() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { isLoaded, isSignedIn } = useUser();
  if (isLoading || !isLoaded)
    return (
      <p className="container empty-state" role="status">
        Connecting to your neighborhood…
      </p>
    );
  if (!isSignedIn)
    return (
      <section className="setup-state container">
        <h1>Your neighborhood awaits.</h1>
        <Link className="button" href="/sign-in">
          Sign in to continue
        </Link>
      </section>
    );
  if (!isAuthenticated)
    return (
      <section className="setup-state container">
        <h1>We couldn’t connect your session.</h1>
        <p>
          Please try signing in again. If this continues, the library’s sign-in
          connection may need attention.
        </p>
        <Link className="button" href="/sign-in">
          Back to sign-in
        </Link>
      </section>
    );
  return <ConnectedDashboard />;
}
type View = "browse" | "listings" | "requests" | "incoming" | "admin";
function ConnectedDashboard() {
  const me = useQuery(api.users.me, {});
  const tools = useQuery(api.tools.list, {});
  const listings = useQuery(api.tools.mine, {});
  const requests = useQuery(api.loans.mine, {});
  const incoming = useQuery(api.loans.incoming, {});
  const allLoans = useQuery(api.loans.all, me?.role === "admin" ? {} : "skip");
  const health = useQuery(
    api.automation.health,
    me?.role === "admin" ? {} : "skip",
  );
  const create = useMutation(api.tools.create);
  const update = useMutation(api.tools.update);
  const remove = useMutation(api.tools.remove);
  const request = useMutation(api.loans.request);
  const decide = useMutation(api.loans.decide);
  const returnLoan = useMutation(api.loans.returnLoan);
  const setTrusted = useMutation(api.users.setTrusted);
  const [view, setView] = useState<View>("browse");
  const [category, setCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"tools">>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function perform(operation: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setNotice(message);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function save(fields: ToolFields) {
    if (editing) await update({ id: editing._id, ...fields });
    else await create(fields);
    setFormOpen(false);
    setNotice(
      editing
        ? "Your listing has been updated."
        : "Your tool is now part of the neighborhood.",
    );
    setView("listings");
  }
  function confirmRemove(id: Id<"tools">) {
    if (
      window.confirm(
        "Remove this listing? Existing loans will stay in your history.",
      )
    )
      void perform(
        () => remove({ id }),
        "Listing removed. Existing loans are preserved.",
      );
  }
  const tabs: { value: View; label: string; count?: number }[] = [
    { value: "browse", label: "Explore tools" },
    { value: "listings", label: "My listings", count: listings?.length },
    {
      value: "requests",
      label: "My requests",
      count: requests?.filter((loan) => loan.status === "pending").length,
    },
    {
      value: "incoming",
      label: "Incoming requests",
      count: incoming?.filter((loan) => loan.status === "pending").length,
    },
    ...(me?.role === "admin"
      ? [{ value: "admin" as const, label: "Administration" }]
      : []),
  ];
  const selectedLoans =
    view === "requests" ? requests : view === "incoming" ? incoming : allLoans;
  return (
    <div className="container dashboard">
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Your tool library.</h1>
          <p className="muted">
            Everything you’re sharing, borrowing, and working on.
          </p>
        </div>
        <button
          className="button"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus size={18} /> List a tool
        </button>
      </section>
      <div className="workspace-summary" aria-label="Your library overview">
        <div>
          <Package size={19} aria-hidden="true" />
          <span>My listings</span>
          <strong>{listings?.length ?? "—"}</strong>
        </div>
        <div>
          <CalendarDays size={19} aria-hidden="true" />
          <span>Active borrowing</span>
          <strong>
            {requests?.filter((loan) => loan.status === "approved").length ??
              "—"}
          </strong>
        </div>
        <div>
          <Inbox size={19} aria-hidden="true" />
          <span>Awaiting your reply</span>
          <strong>
            {incoming?.filter((loan) => loan.status === "pending").length ??
              "—"}
          </strong>
        </div>
      </div>
      <nav className="dashboard-tabs" aria-label="Dashboard views">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setView(tab.value);
              setError("");
            }}
            aria-current={view === tab.value ? "page" : undefined}
            className={view === tab.value ? "active" : ""}
          >
            {tab.label}
            {Boolean(tab.count) && <span>{tab.count}</span>}
          </button>
        ))}
      </nav>
      {notice && (
        <p className="success-message" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {formOpen && (
        <ToolForm
          key={editing?._id ?? "new"}
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSave={save}
        />
      )}
      {view === "browse" && (
        <>
          <div className="catalog-toolbar">
            <div>
              <p className="eyebrow">THE NEIGHBORHOOD COLLECTION</p>
              <h2>Explore tools</h2>
            </div>
            <label className="filter-label">
              Category
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="small muted">
            All borrowing dates use UTC. Send a request for the dates you need;
            the lender confirms availability.
          </p>
          {tools === undefined ? (
            <Loading />
          ) : !tools.filter(
              (tool) => category === "all" || tool.category === category,
            ).length ? (
            <Empty
              text={
                category === "all"
                  ? "The shelf is ready. Add the first tool."
                  : "No tools in this category yet."
              }
            >
              <p>
                {category === "all"
                  ? "A drill, a ladder, a set of garden shears. Something in your shed could be just what a neighbor needs."
                  : "Try another category, or share a tool of your own."}
              </p>
              <button
                className="button small-button"
                onClick={() => {
                  setEditing(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus size={16} /> List a tool
              </button>
            </Empty>
          ) : (
            <div className="tool-grid">
              {tools
                .filter(
                  (tool) => category === "all" || tool.category === category,
                )
                .map((tool) => (
                  <ToolCard
                    key={tool._id}
                    tool={tool}
                    busy={busy}
                    onRequest={(start, end) =>
                      perform(
                        () => request({ toolId: tool._id, start, end }),
                        "Request sent. Your neighbor will approve or decline it.",
                      )
                    }
                  />
                ))}
            </div>
          )}
        </>
      )}
      {view === "listings" && (
        <>
          <h2 className="view-title">My listings</h2>
          {listings === undefined ? (
            <Loading />
          ) : !listings.length ? (
            <Empty text="Your first listing could make someone’s next project possible." />
          ) : (
            <div className="listing-list">
              {listings.map((tool) => (
                <article className="listing-row" key={tool._id}>
                  <div>
                    <span className="category-label">{tool.category}</span>
                    <h3>{tool.name}</h3>
                    <p className="small muted">{tool.condition}</p>
                  </div>
                  <div className="form-actions">
                    <button
                      className="button secondary small-button"
                      disabled={busy}
                      onClick={() => {
                        setEditing(tool);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Remove ${tool.name}`}
                      disabled={busy}
                      onClick={() => confirmRemove(tool._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {["requests", "incoming", "admin"].includes(view) && (
        <>
          <h2 className="view-title">
            {view === "requests"
              ? "My requests"
              : view === "incoming"
                ? "Incoming requests"
                : "All loans"}
          </h2>
          {selectedLoans === undefined ? (
            <Loading />
          ) : !selectedLoans.length ? (
            <Empty text="No loans to show yet. Everything starts with a request." />
          ) : (
            <div className="loan-list">
              {selectedLoans.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  lenderView={view === "incoming"}
                  adminView={view === "admin"}
                  busy={busy}
                  onDecide={(approve) =>
                    void perform(
                      () => decide({ id: loan._id, approve }),
                      approve ? "Request approved." : "Request declined.",
                    )
                  }
                  onReturn={() =>
                    void perform(
                      () => returnLoan({ id: loan._id }),
                      "Marked returned. Thank you for keeping the loop going.",
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
      {view === "admin" && (
        <section className="admin-section">
          <h2>Listings & trusted lenders</h2>
          <p className="small muted">
            Administrator access is enforced on the server.
          </p>
          <div className="listing-list">
            {tools?.map((tool) => (
              <article className="listing-row" key={tool._id}>
                <div>
                  <h3>{tool.name}</h3>
                  <p className="small muted">{tool.category}</p>
                </div>
                <div className="form-actions">
                  <button
                    className="button secondary small-button"
                    disabled={busy}
                    onClick={() =>
                      void perform(
                        () =>
                          setTrusted({
                            subject: tool.owner,
                            trusted: !tool.trusted,
                          }),
                        "Lender status updated.",
                      )
                    }
                  >
                    <BadgeCheck size={16} />
                    {tool.trusted ? "Remove trusted status" : "Mark trusted"}
                  </button>
                  <button
                    className="icon-button danger"
                    disabled={busy}
                    aria-label={`Remove ${tool.name}`}
                    onClick={() => confirmRemove(tool._id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="automation-health">
            <h3>Automation health</h3>
            <p>
              {health?.pending ?? "…"} pending events ·{" "}
              {health?.failed.length ?? "…"} recent failed deliveries ·{" "}
              {health?.workflowFailures.length ?? "…"} recent workflow errors
            </p>
            {health?.failed.map((event) => (
              <p className="small error-message" key={event._id}>
                Event {event._id.slice(-8)}: {event.failure} ({event.attempts}{" "}
                attempts)
              </p>
            ))}
            {health?.workflowFailures.map((failure) => (
              <p className="small error-message" key={failure._id}>
                {failure.workflow} workflow failed · execution {failure.key}
              </p>
            ))}
          </div>
        </section>
      )}
      <p className="dashboard-footnote">
        Notifications and overdue reminders use recorded mock deliveries for
        this project.{" "}
        <Link className="text-link" href="/">
          Back to the neighborhood <ArrowUpRight size={14} />
        </Link>
      </p>
    </div>
  );
}
function Loading() {
  return (
    <p role="status" className="empty-state">
      Loading your neighborhood…
    </p>
  );
}
function Empty({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Wrench size={24} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h3>{text}</h3>
      {children}
    </div>
  );
}
