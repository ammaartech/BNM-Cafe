import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { MENU_COLUMNS } from "@/lib/data";
import type { MenuItem } from "@/lib/types";

/**
 * The menu, cached on the server and shared by every visitor.
 *
 * Every visitor sees the same menu, so reading it per request (as the old
 * client-side fetch did) is wasted work. It is cached for 60 seconds, which is
 * also the longest a price or stock change takes to reach a fresh page load;
 * open pages pick changes up sooner through realtime (see useMenuItems).
 * A failed read throws, so an error is never cached in place of the menu.
 */
export const getMenuItems = unstable_cache(
    async (): Promise<MenuItem[]> => {
        const { data, error } = await createPublicClient().from("menu_items").select(MENU_COLUMNS);
        if (error) throw error;
        return (data ?? []) as MenuItem[];
    },
    ["menu-items"],
    { revalidate: 60, tags: ["menu"] }
);

/** Like getMenuItems, but null instead of throwing, so a page can fall back to a client read. */
export async function getMenuItemsSafe(): Promise<MenuItem[] | null> {
    try {
        return await getMenuItems();
    } catch (error) {
        console.error("Server menu read failed; the client will fetch it.", error);
        return null;
    }
}
