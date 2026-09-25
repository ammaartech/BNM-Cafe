import { notFound } from "next/navigation";
import { getMenuItems, getMenuItemsSafe } from "@/lib/menu";
import ItemDetail from "./ItemDetail";

// Every item page is prerendered and refreshed at most once a minute.
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const items = await getMenuItems();
    return items.map((item) => ({ category: item.category, itemId: item.id }));
  } catch {
    // Menu unreachable at build time: render pages on first request instead.
    return [];
  }
}

export default async function MenuItemDetailPage({
  params,
}: {
  params: Promise<{ category: string; itemId: string }>;
}) {
  const { itemId } = await params;
  const items = await getMenuItemsSafe();
  const item = items?.find((m) => m.id === itemId) ?? null;

  // Only a successful read can prove the item doesn't exist.
  if (items && !item) notFound();

  return <ItemDetail itemId={itemId} initialItem={item} />;
}
