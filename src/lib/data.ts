
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
  // North Indian
  {
    id: "ni-01",
    name: "Chapati Platter",
    description: "Soft chapatis served with dal, subzi, and rice.",
    price: 80,
    image: "chapati-platter",
    category: "north-indian",
    stock: 20,
  },
  {
    id: "ni-02",
    name: "Chole Bhature",
    description: "Spicy chickpea curry with fluffy fried bread.",
    price: 70,
    image: "chole-bhature",
    category: "north-indian",
    stock: 18,
  },
  {
    id: "ni-03",
    name: "Aloo Paratha",
    description: "Whole wheat flatbread stuffed with spiced potatoes.",
    price: 50,
    image: "aloo-paratha",
    category: "north-indian",
    stock: 25,
  },
  {
    id: "ni-04",
    name: "Pulao",
    description: "Aromatic basmati rice cooked with mixed vegetables.",
    price: 60,
    image: "pulao",
    category: "north-indian",
    stock: 30,
  },
  // South Indian
  {
    id: "si-01",
    name: "Masala Dosa",
    description: "Crispy rice crepe filled with spiced potatoes.",
    price: 40,
    image: "dosa",
    category: "south-indian",
    stock: 15,
  },
  {
    id: "si-02",
    name: "Set Dosa",
    description: "A set of three soft and spongy dosas.",
    price: 50,
    image: "set-dosa",
    category: "south-indian",
    stock: 20,
  },
  {
    id: "si-03",
    name: "Plain Dosa",
    description: "A simple, crispy rice and lentil crepe.",
    price: 30,
    image: "plain-dosa",
    category: "south-indian",
    stock: 25,
  },
  {
    id: "si-04",
    name: "Bisi Bele Bath",
    description: "Spicy rice and lentil dish with vegetables.",
    price: 60,
    image: "bisi-bele-bath",
    category: "south-indian",
    stock: 15,
  },
  // Refreshments
  {
    id: "rf-01",
    name: "Chai",
    description: "Aromatic spiced tea with milk.",
    price: 15,
    image: "chai",
    category: "refreshments",
    stock: 50,
  },
  {
    id: "rf-02",
    name: "Coffee",
    description: "Authentic South Indian style filter coffee.",
    price: 20,
    image: "coffee",
    category: "refreshments",
    stock: 40,
  },
  // Chats
  {
    id: "ch-01",
    name: "Dahi Puri",
    description: "Crispy shells filled with yogurt, potatoes, and chutneys.",
    price: 40,
    image: "dahi-puri",
    category: "chats",
    stock: 30,
  },
  {
    id: "ch-02",
    name: "Pani Puri",
    description: "Hollow crisps filled with tangy water and potatoes.",
    price: 30,
    image: "pani-puri",
    category: "chats",
    stock: 50,
  },
  {
    id: "ch-03",
    name: "Masala Puri",
    description: "Crushed puris in a spicy green pea curry.",
    price: 35,
    image: "masala-puri",
    category: "chats",
    stock: 40,
  },
  {
    id: "ch-04",
    name: "Bhel Puri",
    description: "Puffed rice mixed with vegetables and tamarind sauce.",
    price: 35,
    image: "bhel-puri",
    category: "chats",
    stock: 40,
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
