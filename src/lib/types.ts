
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

export interface OrderItem {
    id: string; // This will be the menu_item_id
    name: string;
    quantity: number;
    price: number;
}

export interface Order {
  id: string;
  userId?: string; // Optional because old orders might not have it
  userName: string;
  orderDate: string;
  totalAmount: number;
  status: "Pending" | "Ready for Pickup" | "Delivered" | "Cancelled";
  items: OrderItem[];
  // Legacy fields for old static data
  date?: string;
  total?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}


export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role?: 'customer' | 'admin';
}
