import { expect, it } from "vitest";
import { editableFields } from "../lib/catalog";
it("editing a stored tool only submits fields accepted by the listing mutation", () => {
  const stored = {
    _id: "private-id",
    _creationTime: 123,
    owner: "another-field",
    archived: false,
    name: "Drill",
    category: "power tools" as const,
    condition: "good" as const,
    description: "Charged battery",
  };
  expect(editableFields(stored)).toEqual({
    name: "Drill",
    category: "power tools",
    condition: "good",
    description: "Charged battery",
  });
});
