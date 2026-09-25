import type { Category } from "@/lib/types";

export const categories: Category[] = [
  { id: "south-indian", name: "South Indian" },
  { id: "north-indian", name: "North Indian" },
  { id: "refreshments", name: "Refreshments" },
  { id: "chats", name: "Chats" },
];

/** Columns every menu read selects — shared by the server cache and the client. */
export const MENU_COLUMNS =
  "id, uuid, name, description, price, image, category, stock, search_keywords, station_id";
