import { BadgeCheck, Check, House, Package, PackageCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { completedSteps, TRACKING_STEPS, type OrderStatus } from "@/lib/order-status";
import { formatDateTime } from "@/lib/format";

const STEP_ICONS = [BadgeCheck, Package, Truck, PackageCheck, House];

type Event = { id: string; status: OrderStatus | null; title: string; description: string | null; location: string | null; occurred_at: string; source: string };

/** Horizontal 5-step progress with icons. Dates come only from recorded events. */
export function TrackingSteps({ status, events }: { status: OrderStatus; events: Event[] }) {
  const done = completedSteps(status);
  const pct = done <= 1 ? 0 : ((done - 1) / (TRACKING_STEPS.length - 1)) * 100;
  return (
    <div className="relative">
      <div className="absolute left-[10%] right-[10%] top-6 h-1 rounded-full bg-border" aria-hidden>
        <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <ol className="relative grid grid-cols-5">
        {TRACKING_STEPS.map((s, i) => {
           const Icon = STEP_ICONS[i] ?? Package;
          const isDone = i < done;
          const isCurrent = i === done - 1;
          const ev = events.find((e) => e.status === s.status);
          return (
            <li key={s.status} className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "relative grid size-12 place-items-center rounded-full border-2 bg-background transition",
                  isDone ? "border-success bg-success text-success-foreground" : "border-border text-muted-foreground",
                  isCurrent && "ring-4 ring-success/20",
                )}
              >
                <Icon className="size-5" />
                {isDone && !isCurrent && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-background text-success">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={cn("mt-2 text-[11px] font-bold leading-tight sm:text-xs", isDone ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                {ev ? formatDateTime(ev.occurred_at) : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  system: "Sistema",
  admin: "Loja ZENVORI",
  payment_provider: "Provedor de pagamento",
  carrier: "Transportadora",
};

/** Vertical movement history (newest first) built only from recorded events. */
export function TrackingHistory({ events }: { events: Event[] }) {
  const sorted = [...events].sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at));
  if (sorted.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>;
  return (
    <ol className="relative">
      {sorted.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < sorted.length - 1 && <span className="absolute left-[7px] top-4 h-full w-0.5 bg-border" aria-hidden />}
          <span
            className={cn(
              "relative mt-1 size-4 shrink-0 rounded-full border-2",
              i === 0 ? "border-success bg-success ring-4 ring-success/20" : "border-border bg-background",
            )}
          />
          <div className="min-w-0">
            <p className={cn("text-sm font-bold", i === 0 ? "text-success" : "text-foreground")}>{e.title}</p>
            {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(e.occurred_at)}
              {e.location ? ` · ${e.location}` : ""} · {SOURCE_LABEL[e.source] ?? e.source}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
