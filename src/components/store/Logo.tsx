import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * TEMPORARY brand mark. Replace the contents of this component with the
 * official ZENVORI logo files as soon as they are provided — this is the only
 * place the logo is rendered.
 */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link to="/" aria-label="ZENVORI — página inicial" className={cn("inline-flex items-center gap-2", className)}>
      <span
        data-logo-placeholder
        className="grid size-8 place-items-center rounded-lg bg-primary font-display text-lg font-extrabold text-primary-foreground"
      >
        Z
      </span>
      <span
        className={cn(
          "font-display text-xl font-extrabold tracking-[-0.04em]",
          inverted ? "text-ink-foreground" : "text-foreground",
        )}
      >
        ZENVORI
      </span>
    </Link>
  );
}
