"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wrench, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "./category-icon";
function Catalog() {
  const tools = useQuery(api.tools.publicList, {});
  if (tools === undefined)
    return (
      <p role="status" className="empty-state">
        Finding tools in the neighborhood…
      </p>
    );
  if (!tools.length)
    return (
      <div className="empty-state">
        <Wrench size={28} />
        <h3>Every neighborhood starts with one tool.</h3>
        <p>Be the first to share something useful.</p>
        <Link href="/sign-in" className="text-link">
          Sign in to list a tool <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  return (
    <ul className="public-tool-list">
      {tools.map((tool, index) => (
        <li key={`${tool.name}-${index}`}>
          <span className="tool-symbol">
            <CategoryIcon category={tool.category} size={22} />
          </span>
          <div>
            <span className="category-label">{tool.category}</span>
            <h3>{tool.name}</h3>
          </div>
        </li>
      ))}
    </ul>
  );
}
export function PublicTools({ configured }: { configured: boolean }) {
  return configured ? (
    <Catalog />
  ) : (
    <div className="empty-state">
      <Wrench size={28} />
      <h3>A little space for your neighborhood.</h3>
      <p>The shared tool library will appear here once setup is complete.</p>
    </div>
  );
}
