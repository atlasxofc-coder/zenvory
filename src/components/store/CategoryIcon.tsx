import { CookingPot, Dumbbell, Headphones, type LucideIcon, Package, Shirt, Sparkles, Wrench } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Headphones, CookingPot, Shirt, Sparkles, Dumbbell, Wrench };

export function CategoryIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && ICONS[name]) || Package;
  return <Icon className={className} aria-hidden />;
}
