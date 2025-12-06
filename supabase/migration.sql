-- Supabase Migration File
-- This SQL script is designed to create a relational database schema
-- based on the existing Firebase/Firestore data model of the Campus Cafe Connect app.

-- 1. Create ENUM types for controlled vocabularies.
-- This enforces data integrity for menu categories and order statuses.

CREATE TYPE menu_category AS ENUM (
  'south-indian',
  'north-indian',
  'refreshments',
  'chats'
);

CREATE TYPE order_status AS ENUM (
  'Pending',
  'Ready for Pickup',
  'Delivered',
  'Cancelled'
);

-- 2. Create the 'users' table.
-- This table will store user information. In Supabase, this can be linked
-- to the 'auth.users' table using the 'id' as a foreign key.

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'customer' -- For admin/customer roles
);

-- 3. Create the 'menu_items' table.
-- This table stores all the items available in the cafe.

CREATE TABLE menu_items (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image VARCHAR(255), -- Corresponds to the image ID in placeholder-images.json
  category menu_category NOT NULL,
  stock INT NOT NULL DEFAULT 0
);

-- 4. Create the 'orders' table.
-- This table stores customer orders, linking to the user who placed them.

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Use SET NULL if you want to keep orders from deleted users
  user_name VARCHAR(255) NOT NULL,
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_amount NUMERIC(10, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'Pending'
);

-- 5. Create the 'order_items' table.
-- This is a join table that details which menu items are in which order.

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id VARCHAR(255) NOT NULL, -- Storing original menu item ID
  name VARCHAR(255) NOT NULL,         -- Denormalized for historical accuracy
  price NUMERIC(10, 2) NOT NULL,      -- Denormalized price at time of order
  quantity INT NOT NULL,
  UNIQUE (order_id, menu_item_id)
);


-- 6. Create the 'user_favorites' table.
-- This is a many-to-many join table to track users' favorite menu items.

CREATE TABLE user_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id VARCHAR(255) NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, menu_item_id)
);
