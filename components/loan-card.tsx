"use client";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { dateLabel } from "@/lib/catalog";
export type Loan = FunctionReturnType<typeof api.loans.mine>[number];
export function LoanCard({
  loan,
  lenderView,
  adminView,
  busy,
  onDecide,
  onReturn,
}: {
  loan: Loan;
  lenderView?: boolean;
  adminView?: boolean;
  busy: boolean;
  onDecide: (approve: boolean) => void;
  onReturn: () => void;
}) {
  const overdue =
    loan.status === "approved" &&
    loan.end < new Date().toISOString().slice(0, 10);
  return (
    <article className="loan-card">
      <div className="row">
        <h3>{loan.toolName}</h3>
        <span className={`status ${overdue ? "overdue" : loan.status}`}>
          {overdue ? "Overdue" : loan.status}
        </span>
      </div>
      <p className="small muted">
        {dateLabel(loan.start)} – {dateLabel(loan.end)} · UTC
      </p>
      {adminView && <p className="small muted">Loan {loan._id.slice(-8)}</p>}
      {!adminView && (
        <div className="form-actions">
          {lenderView && loan.status === "pending" && (
            <>
              <button
                className="button small-button"
                onClick={() => onDecide(true)}
                disabled={busy}
              >
                Approve
              </button>
              <button
                className="button secondary small-button"
                onClick={() => onDecide(false)}
                disabled={busy}
              >
                Decline
              </button>
            </>
          )}
          {loan.status === "approved" && (
            <button
              className="button secondary small-button"
              onClick={onReturn}
              disabled={busy}
            >
              Mark returned
            </button>
          )}
        </div>
      )}
      {loan.activity.length > 0 && (
        <details className="activity">
          <summary>Recent automation activity</summary>
          <ul>
            {loan.activity.map((item, i) => (
              <li key={`${item.at}-${i}`}>
                {item.kind}
                <time dateTime={new Date(item.at).toISOString()}>
                  {new Date(item.at).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </time>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
