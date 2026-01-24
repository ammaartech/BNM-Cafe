import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Synchronizes overall order status based on station statuses.
 *
 * Rules:
 * - CANCELLED orders are never modified
 * - DELIVERED orders are final and never downgraded
 * - If ALL stations are PICKED_UP → DELIVERED
 * - Else if ALL stations are READY → READY
 * - Else → PENDING
 */
export async function syncOrderStatus(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  // 1️⃣ Fetch current order status
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) return;

  // 🔒 Never touch cancelled or delivered orders
  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    return;
  }

  // 2️⃣ Fetch station statuses
  const { data: stations, error: stationError } = await supabase
    .from("order_stations")
    .select("status")
    .eq("order_id", orderId);

  if (stationError || !stations || stations.length === 0) return;

  const statuses = stations.map((s) => s.status);

  let nextStatus: "PENDING" | "READY" | "DELIVERED";

  // 3️⃣ Decide final order status
  if (statuses.every((s) => s === "PICKED_UP")) {
    nextStatus = "DELIVERED";
  } else if (statuses.every((s) => s === "READY")) {
    nextStatus = "READY";
  } else {
    nextStatus = "PENDING";
  }

  // 4️⃣ Update ONLY if changed
  if (order.status !== nextStatus) {
    await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);
  }
}
