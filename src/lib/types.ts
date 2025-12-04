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
    id: string;
    name: string;
    quantity: number;
    price: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string; // Add userName to store the user's name with the order
  orderDate: string;
  totalAmount: number;
  status: "Pending" | "Ready for Pickup" | "Delivered" | "Cancelled";
  items: OrderItem[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}


export interface UserProfile {
    id: string;
    name: string;
    email: string;
}
