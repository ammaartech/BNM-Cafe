

import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  uuid: string;
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
    id: string;
    uuid: string;
    name: string;
    quantity: number;
    price: number;
}

export type OrderStatus = "PENDING" | "Ready for Pickup" | "Delivered" | "Cancelled";

export interface Order {
  id:string;
  daily_order_id?: string;
  userId?: string; // Optional because old orders might not have it
  userName: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  pickup_notified_at?: string | null;
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
    role: 'admin' | 'customer';
}
