"use client";

import useSWR from "swr";
import { supabase } from "@/lib/supabase/client";
import { useRealtime } from "@/lib/supabase/realtime";
import { MENU_COLUMNS } from "@/lib/data";
import type { MenuItem } from "@/lib/types";

export const MENU_KEY = ["menu"] as const;

async function fetchMenu(): Promise<MenuItem[]> {
    const { data, error } = await supabase.from("menu_items").select(MENU_COLUMNS);
    if (error) throw error;
    return (data ?? []) as MenuItem[];
}

/**
 * The menu, shared by every screen through one SWR cache entry. `initial` is
 * the server-rendered copy, so the first paint never waits on the network.
 * Stock and price edits arrive live through realtime.
 */
export function useMenuItems(initial?: MenuItem[] | null) {
    const swr = useSWR(MENU_KEY, fetchMenu, {
        fallbackData: initial ?? undefined,
        // The server copy is at most 60s old; don't refetch it on mount.
        // Callers must not read `isLoading` for the skeleton: with this option
        // SWR reports it as true on re-renders even though no fetch is running.
        revalidateOnMount: !initial,
        revalidateOnFocus: false,
    });
    useRealtime("menu", [{ table: "menu_items" }], () => swr.mutate(), { debounceMs: 500 });
    return swr;
}
