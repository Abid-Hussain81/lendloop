"use client";
import { useState } from "react";
import { BadgeCheck, Wrench } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { dateLabel } from "@/lib/catalog";
export type BrowseTool = FunctionReturnType<typeof api.tools.list>[number];
export function ToolCard({
  tool,
  busy,
  onRequest,
}: {
  tool: BrowseTool;
  busy: boolean;
  onRequest: (start: string, end: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const min = new Date().toISOString().slice(0, 10);
  return (
    <article className="tool-card">
      <div className={`tool-card-art ${tool.category.replaceAll(" ", "-")}`}>
        <Wrench size={42} strokeWidth={1.1} />
        <span className="art-category">{tool.category}</span>
      </div>
      <div className="tool-card-body">
        <div className="row">
          <span className="category-label">{tool.condition}</span>
          <span
            className={`status ${tool.available ? "available" : "pending"}`}
          >
            {tool.available ? "Available today" : "On loan"}
          </span>
        </div>
        <h3>{tool.name}</h3>
        <p className="tool-description">{tool.description}</p>
        {tool.trusted && (
          <p className="trusted">
            <BadgeCheck size={16} /> Trusted lender
          </p>
        )}
        {tool.reservations.length > 0 && (
          <details className="reservations">
            <summary>Reserved dates</summary>
            <ul>
              {tool.reservations.map((range, i) => (
                <li key={i}>
                  {dateLabel(range.start)} – {dateLabel(range.end)}
                </li>
              ))}
            </ul>
          </details>
        )}
        {tool.owned ? (
          <p className="small muted">Your listing · manage it in My listings</p>
        ) : open ? (
          <form
            className="borrow-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await onRequest(start, end)) setOpen(false);
            }}
          >
            <div className="form-columns">
              <label>
                From (UTC)
                <input
                  required
                  type="date"
                  min={min}
                  value={start}
                  onChange={(event) => {
                    setStart(event.target.value);
                    if (end < event.target.value) setEnd(event.target.value);
                  }}
                />
              </label>
              <label>
                Through (UTC)
                <input
                  required
                  type="date"
                  min={start || min}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="button small-button" disabled={busy}>
                {busy ? "Sending…" : "Send request"}
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            className="button secondary full-width"
            onClick={() => setOpen(true)}
            disabled={busy}
          >
            Request to borrow <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
    </article>
  );
}
