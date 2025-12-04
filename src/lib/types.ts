import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "south-indian" | "north-indian" | "refreshments" | "chats";
  stock: number;
}

export interface Category {
  id: "south-indian" | "north-indian" | "refreshments" | "chats";
  name: string;
  description: string;
  image: string;
  icon: LucideIcon;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: "Delivered" | "Pending" | "Cancelled";
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}
