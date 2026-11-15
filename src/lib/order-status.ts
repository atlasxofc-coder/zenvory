import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_approved: "Pagamento aprovado",
  preparing: "Em preparação",
  shipped: "Enviado",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  refused: "Recusado",
  refunded: "Estornado",
  canceled: "Cancelado",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
};

/** The five customer-facing tracking steps, in order. */
export const TRACKING_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "payment_approved", label: "Pagamento aprovado" },
  { status: "preparing", label: "Pedido em preparação" },
  { status: "shipped", label: "Pedido enviado" },
  { status: "out_for_delivery", label: "Saiu para entrega" },
  { status: "delivered", label: "Pedido entregue" },
];

/**
 * How many tracking steps are complete for an order status.
 * 0 while payment is not confirmed by the provider, or when canceled.
 */
export function completedSteps(status: OrderStatus): number {
  const idx = TRACKING_STEPS.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx + 1;
}

/** Statuses an admin may move an order to from its current status. */
export function nextAdminStatuses(status: OrderStatus, paymentStatus: PaymentStatus): OrderStatus[] {
  if (status === "delivered" || status === "canceled") return [];
  if (paymentStatus !== "approved") return ["canceled"];
  const order: OrderStatus[] = ["payment_approved", "preparing", "shipped", "out_for_delivery", "delivered"];
  const i = order.indexOf(status);
  return [...order.slice(i + 1), "canceled"];
}
