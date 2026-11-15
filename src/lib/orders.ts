import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: async () => {
      const [o, items, events] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
        supabase.from("tracking_events").select("*").eq("order_id", id).order("occurred_at", { ascending: false }),
      ]);
      if (o.error) throw o.error;
      if (items.error) throw items.error;
      if (events.error) throw events.error;
      return o.data ? { order: o.data, items: items.data, events: events.data } : null;
    },
  });

export type ShippingAddress = {
  recipient?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};
