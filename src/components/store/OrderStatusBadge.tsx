import { cn } from "@/lib/utils";
import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

const TONE: Record<OrderStatus, string> = {
  awaiting_payment: "bg-warning-soft text-foreground",
  payment_approved: "bg-success-soft text-success",
  preparing: "bg-success-soft text-success",
  shipped: "bg-success-soft text-success",
  out_for_delivery: "bg-success-soft text-success",
  delivered: "bg-success text-success-foreground",
  canceled: "bg-muted text-muted-foreground",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
