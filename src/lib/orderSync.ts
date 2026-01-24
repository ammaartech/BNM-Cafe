
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Synchronizes the main order status based on the status of its constituent station tickets.
 *
 * This function checks if all station-specific tickets for a given order are 'READY'.
 * - If all are 'READY' and the main order is not, it updates the main order to 'READY'.
 * - If not all are 'READY' but the main order is, it reverts the main order to 'PENDING'.
 * This ensures the main order status accurately reflects the aggregate state of its parts.
 *
 * @param {string} orderId - The UUID of the order to synchronize.
 * @param {SupabaseClient} supabase - The Supabase client instance.
 */
export async function syncOrderStatus(orderId: string, supabase: SupabaseClient): Promise<void> {
  if (!orderId || !supabase) {
    return;
  }

  // 1. Fetch all station statuses for the given orderId
  const { data: stationStatuses, error: stationError } = await supabase
    .from('order_stations')
    .select('status')
    .eq('order_id', orderId);

  // If there's an error or no station tickets, we can't proceed.
  if (stationError || !stationStatuses || stationStatuses.length === 0) {
    return;
  }

  // 2. Determine if all stations are ready
  const allStationsReady = stationStatuses.every(s => s.status === 'READY');

  // 3. Fetch the current main order status
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();
  
  // If there's an error or the order doesn't exist, we can't proceed.
  if (orderError || !orderData) {
    return;
  }

  const currentOrderStatus = orderData.status;

  // 4. Apply synchronization logic
  if (allStationsReady && currentOrderStatus !== 'READY') {
    // Logic Rule 1: All stations are ready, so the main order should be ready.
    await supabase
      .from('orders')
      .update({ status: 'READY' })
      .eq('id', orderId);
  } else if (!allStationsReady && currentOrderStatus === 'READY') {
    // Logic Rule 2: A station was likely reverted. Roll back the main order status.
    await supabase
      .from('orders')
      .update({ status: 'PENDING' })
      .eq('id', orderId);
  }
  // Otherwise, do nothing. The status is either correct or in a state that doesn't need changing (e.g., PENDING).
}
