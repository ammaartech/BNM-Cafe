-- Supabase/PostgreSQL Migration File
-- Generated based on the data model in docs/backend.json

-- Enable Row Level Security (RLS) for all tables by default.
-- Supabase best practice: default to secure, then open up with policies.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM public;

-- Table for Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    stock INT NOT NULL DEFAULT 0
);
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE menu_items IS 'Represents an item available on the cafe menu.';

-- Table for Users
-- Note: Supabase's `auth.users` table typically handles user data.
-- This table can store additional public profile information if needed.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or TEXT to match Firebase UIDs
    email TEXT UNIQUE NOT NULL
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE users IS 'Represents a user of the Campus Cafe Connect application.';

-- Table for Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or TEXT
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Or TEXT
    order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_amount NUMERIC NOT NULL,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' -- e.g., 'Pending', 'Ready for Pickup', 'Delivered', 'Cancelled'
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE orders IS 'Represents a customer order.';

-- Table for Order Items (a join table between Orders and MenuItems)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or TEXT
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    -- Store name and price at the time of order to prevent changes if the menu item is updated later.
    price_at_order NUMERIC NOT NULL,
    name_at_order TEXT NOT NULL,
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE order_items IS 'Represents an item within an order, including quantity and price at time of purchase.';
-- Create an index for faster lookups of items within an order.
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Table for User Favorites (many-to-many relationship between Users and MenuItems)
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, menu_item_id)
);
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE user_favorites IS 'Stores the many-to-many relationship for users favoriting menu items.';

-- Add RLS policies below as needed, for example:
-- CREATE POLICY "Public can read menu items" ON menu_items FOR SELECT USING (true);
-- CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
