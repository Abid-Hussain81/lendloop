import { ConvexError } from "convex/values";

export const today = () => new Date().toISOString().slice(0, 10);
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function validateRange(start: string, end: string) {
  if (!validDate(start) || !validDate(end) || start > end || start < today()) {
    throw new ConvexError(
      "Choose valid UTC dates, starting today or later, with the end on or after the start.",
    );
  }
}
export function overlaps(
  a: { start: string; end: string },
  b: { start: string; end: string },
) {
  return a.start <= b.end && b.start <= a.end;
}
