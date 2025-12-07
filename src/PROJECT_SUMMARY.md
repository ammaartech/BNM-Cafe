# Project Summary: Campus Cafe Connect

This document provides a comprehensive overview of the Campus Cafe Connect web application, detailing its purpose, architecture, features, and technical implementation.

## 1. High-Level Overview

Campus Cafe Connect is a modern, mobile-first web application designed to serve as a digital storefront for a university cafe. It allows students and staff to browse the menu, place orders, and track their order history. The application also includes an administrative dashboard for cafe staff to manage incoming orders and view sales analytics.

The project is built on a modern tech stack, prioritizing real-time updates, a responsive user interface, and a seamless user experience.

---

## 2. Technical Architecture

The application is a full-stack Next.js project that leverages server-side rendering and client-side interactivity.

-   **Framework**: Next.js 15 with the App Router.
-   **Language**: TypeScript for type-safety and robust code.
-   **Styling**: Tailwind CSS for utility-first styling, with ShadCN UI for the component library, providing a consistent and modern design system.
-   **Database & Backend**: Supabase is used as the all-in-one backend solution, providing:
    -   **PostgreSQL Database**: To store all application data.
    -   **Authentication**: To manage user sign-up, login, and sessions.
    -   **Real-time Subscriptions**: To push live updates to both users (order status) and admins (new orders).
-   **State Management**: React Context is used for managing global state, such as the shopping cart, user preferences (favorites), and the Supabase session.

---

## 3. User Interface (UI) and User Experience (UX)

The UI is designed to be clean, intuitive, and mobile-friendly, resembling a native mobile application.

-   **Layout**: A single-page application feel is achieved within a `max-w-md` container for most user-facing views, optimized for mobile screens. Admin pages use a wider layout.
-   **Core Components**:
    -   **Login/Signup Page**: A clean, tabbed interface for user authentication.
    -   **Menu Page**: The main landing page for logged-in users, featuring category filters, a search bar, and a grid of `MenuItemGridCard` components.
    -   **Item Detail Page**: A dedicated view for a single menu item with a large image, description, quantity selector, and an "Add to Cart" button.
    -   **Shopping Cart**: A clear summary of items, quantities, and prices, with options to update or remove items.
    -   **Bottom Navigation Bar**: Provides quick access to Home, Orders, Favorites, and the Cart.
-   **Real-time Features**:
    -   The admin dashboard receives new orders instantly.
    -   Users see their order status change in real-time on the order ticket page.
    -   The cart badge on the navigation bar updates as items are added or removed.

---

## 4. Database Schema (Supabase)

The application relies on several key tables within the Supabase PostgreSQL database:

-   `menu_items`: Stores details for each food and drink item, including name, price, description, category, and stock level.
-   `users`: Stores public profile information for registered users, such as their name and email, linked to the `auth.users` table.
-   `orders`: Contains a record for each order placed, including the user who placed it, the total amount, and the current status (`Pending`, `Ready for Pickup`, `Delivered`, `Cancelled`).
-   `order_items`: A junction table linking `orders` and `menu_items`. It stores the specific items and quantities associated with each order.
-   `user_cart_items`: Stores the contents of each user's shopping cart, allowing it to persist between sessions.
-   `user_favorites`: Stores a record of which menu items a user has marked as a favorite.

Row-Level Security (RLS) policies are (or should be) in place to ensure users can only access and modify their own data (e.g., their own cart, orders, and favorites).

---

## 5. Core Functionality & Logic

-   **Authentication**: Managed by `SupabaseProvider`, which wraps the application. It handles user login, sign-up, and session management. It also fetches the user's profile and redirects them based on their auth state (e.g., redirecting unauthenticated users from the menu to the login page).
-   **Cart Management**: The `CartContext` provides all functionality for the shopping cart. It optimistically updates the UI for speed and then syncs changes with the `user_cart_items` table in Supabase.
-   **Order Placement**: The `placeOrder` function in `CartContext` orchestrates a multi-step process: it creates a new entry in the `orders` table, adds the corresponding items to `order_items`, clears the user's cart from the database, and finally redirects the user to their new order ticket.
-   **Admin Dashboard**:
    -   **Order Management**: The dashboard at `/admin` subscribes to real-time changes in the `orders` table. It displays live orders and allows an admin to update the order status.
    -   **Analytics**: The `/admin/analytics` page fetches and aggregates data from `orders` and `order_items` to generate key performance indicators (KPIs) like total revenue, total sales, and top-selling products.
