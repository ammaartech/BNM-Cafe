import { getMenuItemsSafe } from "@/lib/menu";
import MenuClient from "./MenuClient";

// Rebuilt at most once a minute and served from cache in between, so the menu
// is in the HTML instead of being fetched after the page loads.
export const revalidate = 60;

export default async function MenuPage() {
  const initialItems = await getMenuItemsSafe();
  return <MenuClient initialItems={initialItems} />;
}
