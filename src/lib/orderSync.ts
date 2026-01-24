import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus } from "./types";

/**
 * Synchronizes overall order status based on station statuses.
 */
export async function syncOrderStatus(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  // 1️⃣ Fetch current order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) return;

  // 🔒 Never modify an order that's already finished or cancelled
  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    return;
  }

  // 2️⃣ Fetch all station tickets for this order
  const { data: stations, error: stationError } = await supabase
    .from("order_stations")
    .select("status")
    .eq("order_id", orderId);

  if (stationError || !stations || stations.length === 0) return;

  const statuses = stations.map((s) => s.status);

  let nextStatus: OrderStatus;

  // 3️⃣ Decide final order status based on improved logic
  if (statuses.every((s) => s === "PICKED_UP")) {
    nextStatus = "DELIVERED";
  } else if (statuses.some((s) => s === "PENDING")) {
    nextStatus = "PENDING";
  } else {
    // This covers "all READY" and "mix of READY and PICKED_UP" cases
    nextStatus = "READY";
  }

  // 4️⃣ Update the main order ONLY if the status needs to change
  if (order.status !== nextStatus) {
    await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);
  }
}
