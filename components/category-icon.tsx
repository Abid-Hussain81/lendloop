import { Hammer, Sprout, Tent, Utensils, Package } from "lucide-react";

const icons = {
  "power tools": Hammer,
  garden: Sprout,
  camping: Tent,
  kitchen: Utensils,
  other: Package,
};

export function CategoryIcon({
  category,
  size = 24,
}: {
  category: string;
  size?: number;
}) {
  const Icon = icons[category as keyof typeof icons] ?? Package;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
