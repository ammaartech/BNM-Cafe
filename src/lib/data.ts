import type { Category, MenuItem, Order } from "@/lib/types";
import { Coffee, Sandwich, Soup, UtensilsCrossed } from "lucide-react";

export const categories: Category[] = [
  {
    id: "south-indian",
    name: "South Indian",
    description: "Classic flavors from the South",
    image: "south-indian-category",
    icon: Soup,
  },
  {
    id: "north-indian",
    name: "North Indian",
    description: "Rich and hearty dishes from the North",
    image: "north-indian-category",
    icon: UtensilsCrossed,
  },
  {
    id: "refreshments",
    name: "Refreshments",
    description: "Cool drinks to quench your thirst",
    image: "refreshments-category",
    icon: Coffee,
  },
  {
    id: "chats",
    name: "Chats",
    description: "Savory and tangy street food delights",
    image: "chats-category",
    icon: Sandwich,
  },
];

export const menuItems: MenuItem[] = [
  // South Indian
  {
    id: "si-01",
    name: "Masala Dosa",
    description: "Crispy rice crepe filled with spiced potatoes.",
    price: 3.5,
    image: "dosa",
    category: "south-indian",
    stock: 15,
  },
  {
    id: "si-02",
    name: "Idli Platter",
    description: "Steamed rice cakes served with sambar and chutney.",
    price: 2.75,
    image: "idli",
    category: "south-indian",
    stock: 20,
  },
  {
    id: "si-03",
    name: "Medu Vada",
    description: "Savory fried lentil doughnuts.",
    price: 3.0,
    image: "vada",
    category: "south-indian",
    stock: 0,
  },
  // North Indian
  {
    id: "ni-01",
    name: "Butter Chicken",
    description: "Creamy tomato-based curry with tender chicken.",
    price: 8.5,
    image: "butter-chicken",
    category: "north-indian",
    stock: 12,
  },
  {
    id: "ni-02",
    name: "Paneer Tikka Masala",
    description: "Grilled cottage cheese in a spicy, flavorful gravy.",
    price: 7.75,
    image: "paneer-tikka",
    category: "north-indian",
    stock: 10,
  },
  {
    id: "ni-03",
    name: "Chole Bhature",
    description: "Spicy chickpea curry served with fluffy fried bread.",
    price: 6.5,
    image: "chole-bhature",
    category: "north-indian",
    stock: 18,
  },
  // Refreshments
  {
    id: "rf-01",
    name: "Fresh Lemonade",
    description: "Sweet and tangy, made with fresh lemons.",
    price: 2.0,
    image: "lemonade",
    category: "refreshments",
    stock: 30,
  },
  {
    id: "rf-02",
    name: "Iced Tea",
    description: "Chilled black tea with a hint of lemon.",
    price: 2.25,
    image: "iced-tea",
    category: "refreshments",
    stock: 25,
  },
  {
    id: "rf-03",
    name: "Filter Coffee",
    description: "Authentic South Indian style filter coffee.",
    price: 1.75,
    image: "coffee",
    category: "refreshments",
    stock: 40,
  },
  // Chats
  {
    id: "ch-01",
    name: "Pani Puri",
    description: "Hollow crisps filled with tangy water and potatoes.",
    price: 3.0,
    image: "pani-puri",
    category: "chats",
    stock: 50,
  },
  {
    id: "ch-02",
    name: "Bhel Puri",
    description: "Puffed rice mixed with vegetables and tamarind sauce.",
    price: 2.5,
    image: "bhel-puri",
    category: "chats",
    stock: 40,
  },
  {
    id: "ch-03",
    name: "Samosa Chaat",
    description: "Crushed samosas topped with yogurt, chutney, and spices.",
    price: 4.0,
    image: "samosa-chaat",
    category: "chats",
    stock: 20,
  },
];

export const orders: Order[] = [
  {
    id: "ORD-001",
    date: "2023-10-26",
    total: 12.75,
    status: "Delivered",
    items: [
      { name: "Butter Chicken", quantity: 1, price: 8.5 },
      { name: "Samosa Chaat", quantity: 1, price: 4.25 },
    ],
  },
  {
    id: "ORD-002",
    date: "2023-10-24",
    total: 5.75,
    status: "Delivered",
    items: [
      { name: "Idli Platter", quantity: 1, price: 2.75 },
      { name: "Pani Puri", quantity: 1, price: 3.0 },
    ],
  },
  {
    id: "ORD-003",
    date: "2023-10-22",
    total: 8.5,
    status: "Cancelled",
    items: [{ name: "Chole Bhature", quantity: 1, price: 6.5 }, { name: "Iced Tea", quantity: 1, price: 2.0 }],
  },
];
