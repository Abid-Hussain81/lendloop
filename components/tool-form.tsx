"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { categories, conditions, editableFields } from "@/lib/catalog";
import { errorMessage } from "@/lib/errors";
export type ToolFields = Pick<
  Doc<"tools">,
  "name" | "category" | "condition" | "description"
>;
export function ToolForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Doc<"tools">;
  onSave: (fields: ToolFields) => Promise<void>;
  onClose: () => void;
}) {
  const [fields, setFields] = useState<ToolFields>(() =>
    editableFields(initial),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="form-panel" aria-labelledby="tool-form-title">
      <div className="row">
        <h2 id="tool-form-title">
          {initial ? "Edit your listing" : "Share something useful"}
        </h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close tool form"
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(fields);
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Tool name
          <input
            required
            maxLength={100}
            value={fields.name}
            onChange={(event) =>
              setFields({ ...fields, name: event.target.value })
            }
            placeholder="e.g. Cordless drill"
            autoFocus
          />
        </label>
        <div className="form-columns">
          <label>
            Category
            <select
              value={fields.category}
              onChange={(event) =>
                setFields({
                  ...fields,
                  category: event.target.value as ToolFields["category"],
                })
              }
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Condition
            <select
              value={fields.condition}
              onChange={(event) =>
                setFields({
                  ...fields,
                  condition: event.target.value as ToolFields["condition"],
                })
              }
            >
              {conditions.map((condition) => (
                <option key={condition}>{condition}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          A little about it
          <textarea
            required
            rows={3}
            maxLength={1000}
            value={fields.description}
            onChange={(event) =>
              setFields({ ...fields, description: event.target.value })
            }
            placeholder="What should a neighbor know?"
          />
        </label>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "List your tool"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
