export const categories = [
  "power tools",
  "garden",
  "kitchen",
  "camping",
  "other",
] as const;
export const conditions = ["like new", "good", "well used"] as const;
export type ToolFields = {
  name: string;
  category: (typeof categories)[number];
  condition: (typeof conditions)[number];
  description: string;
};
export function editableFields(tool?: ToolFields): ToolFields {
  return {
    name: tool?.name ?? "",
    category: tool?.category ?? "power tools",
    condition: tool?.condition ?? "good",
    description: tool?.description ?? "",
  };
}
export function dateLabel(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
