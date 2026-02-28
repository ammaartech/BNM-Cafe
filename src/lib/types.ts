

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
  search_keywords?: string[];
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
  menu_item_id?: string;
}

export type OrderStatus = "PENDING" | "COOKING" | "READY" | "PICKED_UP" | "DELIVERED" | "CANCELLED";
export type OrderStationStatus = 'PENDING' | 'READY' | 'PICKED_UP';


export interface Order {
  id: string;
  display_order_id?: string;
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

export interface Station {
  id: string;
  code: string;
  name: string;
  active: boolean;
  description?: string;
}

export interface StationOrder {
  orderStationId: string;
  orderId: string;
  displayOrderId: string;
  userName: string;
  orderDate: string;
  status: OrderStationStatus;
  items: OrderItem[];
}

export interface CustomerFeedback {
  id: string;
  user_id: string;
  order_id?: string;
  name?: string;
  phone: string;
  email: string;
  body: string;
  created_at: string;
}

