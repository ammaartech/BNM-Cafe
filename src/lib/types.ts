

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
  station_id?: string;
}

export interface Category {
  id: "south-indian" | "north-indian" | "refreshments" | "chats";
  name: string;
  description: string;
  image: string;
  icon: LucideIcon;
}

export interface OrderItem {
    id: string; // This is order_items.id (UUID)
    uuid: string; // This is menu_items.uuid (UUID)
    name: string;
    quantity: number;
    price: number;
}

export type OrderStatus = "PENDING" | "COOKING" | "READY_FOR_PICKUP" | "DELIVERED" | "CANCELLED";

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
    role: 'admin' | 'customer' | 'staff';
    station_id?: string;
}

// Types for Staff KOT Dashboard
export type StationOrderItemStatus = 'PENDING' | 'COOKING' | 'READY' | 'PICKED_UP';
export type StationOrderStatus = 'PENDING' | 'COOKING' | 'READY' | 'PICKED_UP';


export type StationOrderItem = {
  id: string; // order_items.id
  name: string;
  quantity: number;
  status: StationOrderItemStatus;
};

export type KotTicket = {
  orderId: string;
  dailyOrderId: string;
  orderDate: string;
  stationStatus: StationOrderStatus;
  items: StationOrderItem[];
};

export interface Station {
  id: string;
  code: string;
  name: string;
  active: boolean;
  sort_order: number;
}
