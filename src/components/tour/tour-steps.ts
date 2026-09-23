// Step definitions for the guided tours.
//
// A tour is a linear list of steps that can span several pages. The engine in
// TourProvider keeps the tour in sync with the current route: if the visitor
// navigates on their own, it jumps to the step for the page they landed on.

export type TourId = 'customer' | 'staff';

export interface TourContext {
  /** A public demo account is configured (see src/lib/demo.ts). */
  isDemo: boolean;
}

type Copy = string | ((ctx: TourContext) => string);

export interface TourStep {
  id: string;
  /** Page this step belongs to — exact pathname or a pattern. */
  path: string | RegExp;
  /** Where "Next" navigates when arriving from another page. Omit for pages that
   *  need a dynamic URL (item detail, order ticket) — mark those `optional`. */
  href?: string;
  /** CSS selectors to spotlight; the first visible match wins. Omit for a centered card. */
  target?: string[];
  title: string;
  body: Copy;
  /** Shown instead of `body` when the target never appears (e.g. an empty cart). */
  fallback?: Copy;
  /** Only shown when the visitor opens that page themselves; "Next" skips it. */
  optional?: boolean;
  /** Replaces the Next button with a hint — the visitor has to do something first. */
  waitFor?: string;
  nextLabel?: string;
}

const tour = (selector: string) => `[data-tour="${selector}"]`;

export const TOURS: Record<TourId, TourStep[]> = {
  customer: [
    {
      id: 'welcome',
      path: '/login',
      href: '/login',
      title: 'Welcome to B.N.M Cafe',
      body: 'This is a campus-cafe ordering app. In about two minutes you’ll browse the menu, build a cart, check out and watch an order get prepared live.',
      nextLabel: 'Start the tour',
    },
    {
      id: 'sign-in',
      path: '/login',
      href: '/login',
      target: [tour('demo-login'), tour('auth-card')],
      title: 'Sign in to start ordering',
      body: ({ isDemo }) =>
        isDemo
          ? 'Tap “Use demo account” to jump straight in — no sign-up needed. The tour picks up again on the menu.'
          : 'Log in, or create an account on the Sign Up tab. The tour picks up again on the menu.',
      waitFor: 'Sign in to continue',
    },
    {
      id: 'filters',
      path: '/menu',
      href: '/menu',
      target: [tour('menu-filters')],
      title: 'Browse by category',
      body: 'Filter the menu by category, or tap Favorites to see only the items you’ve saved.',
    },
    {
      id: 'search',
      path: '/menu',
      href: '/menu',
      target: [tour('menu-search')],
      title: 'Search the menu',
      body: 'Tap the magnifier to search by name, description or keyword.',
    },
    {
      id: 'add-item',
      path: '/menu',
      href: '/menu',
      target: [tour('menu-item')],
      title: 'Add something to your cart',
      body: 'Tap + to add an item straight to your cart, or tap the photo for details. Go ahead — add one or two items now.',
      fallback: 'The menu is still loading. Once items appear, tap + on any of them to add it to your cart.',
    },
    {
      id: 'favorite',
      path: '/menu',
      href: '/menu',
      target: [tour('menu-favorite')],
      title: 'Save your favorites',
      body: 'Tap the heart to save an item. Favorites are stored on your account, so they follow you across devices.',
    },
    {
      id: 'item-detail',
      path: /^\/menu\/[^/]+\/[^/]+$/,
      target: [tour('item-add')],
      title: 'Pick a quantity',
      body: 'Choose how many you want, then add them to your cart in one go. Use the back arrow to return to the menu.',
      optional: true,
    },
    {
      id: 'nav-cart',
      path: '/menu',
      href: '/menu',
      target: [tour('nav-cart')],
      title: 'Your cart lives here',
      body: 'The badge counts the items you’ve added. Tap Next to open your cart.',
    },
    {
      id: 'cart',
      path: '/cart',
      href: '/cart',
      target: [tour('cart-items')],
      title: 'Review your order',
      body: 'Change quantities or remove items here. Prices already include 5% GST.',
      fallback: 'Your cart is empty. Head back to the menu, tap + on an item, then come back — the tour will wait.',
    },
    {
      id: 'cart-checkout',
      path: '/cart',
      href: '/cart',
      target: [tour('cart-checkout')],
      title: 'Head to checkout',
      body: 'When you’re happy with your cart, continue to checkout.',
    },
    {
      id: 'checkout',
      path: '/checkout',
      href: '/checkout',
      target: [tour('checkout-pay')],
      title: 'Choose how to pay',
      body: ({ isDemo }) =>
        'Pay at Counter places the order now and you pay the cashier when you collect it. Pay online opens Razorpay’s secure checkout.' +
        (isDemo ? ' To try the app, Pay at Counter is quickest — no card needed.' : ''),
      fallback: 'Checkout needs something in your cart. Add an item from the menu and you’ll see the payment options here.',
    },
    {
      id: 'orders',
      path: '/orders',
      href: '/orders',
      target: [tour('orders-list')],
      title: 'Track your orders',
      body: 'Every order you place shows up here with its status. Tap one to open its live ticket.',
      fallback: 'You haven’t placed an order yet. Once you do, it appears here and you can tap it to follow it live.',
    },
    {
      id: 'order-ticket',
      path: /^\/orders\/[^/]+$/,
      target: [tour('order-number')],
      title: 'Your live order ticket',
      body: 'Show this number at the counter. Each kitchen station updates its items in real time, so you’ll see them go from Preparing to Ready without refreshing.',
      optional: true,
    },
    {
      id: 'profile',
      path: '/profile',
      href: '/profile',
      target: [tour('profile-tour')],
      title: 'Settings and replay',
      body: 'Your profile has dark mode, your feedback history, and this tour — replay it any time from here.',
    },
    {
      id: 'done',
      path: '/profile',
      href: '/profile',
      title: 'That’s the tour!',
      body: ({ isDemo }) =>
        isDemo
          ? 'You’ve seen the customer side. Behind the counter, B.N.M Cafe also runs a cashier point-of-sale, kitchen-station displays and a live analytics dashboard — those need a staff account.'
          : 'You’re all set. Enjoy your food!',
      nextLabel: 'Finish',
    },
  ],

  staff: [
    {
      id: 'admin-nav',
      path: '/admin',
      href: '/admin',
      target: [tour('admin-nav')],
      title: 'Staff tools',
      body: 'Everything staff need is here: live orders, analytics, the cashier point-of-sale, kitchen stations and customer feedback.',
      nextLabel: 'Show me around',
    },
    {
      id: 'admin-kot',
      path: '/admin',
      href: '/admin',
      target: [tour('admin-kot-tabs')],
      title: 'Live orders (KOT)',
      body: 'New orders appear here the moment they’re placed. Switch tabs to see completed orders or the full history.',
    },
    {
      id: 'cashier-menu',
      path: '/admin/cashier',
      href: '/admin/cashier',
      target: [tour('cashier-menu')],
      title: 'Take walk-in orders',
      body: 'Tap items to build a bill for customers ordering at the counter. Use search or the category tabs to find items fast.',
    },
    {
      id: 'cashier-pending',
      path: '/admin/cashier',
      href: '/admin/cashier',
      target: [tour('cashier-pending')],
      title: 'Collect pending payments',
      body: 'Orders placed with “Pay at Counter” wait here until the customer pays. The badge shows how many are waiting.',
    },
    {
      id: 'cashier-bill',
      path: '/admin/cashier',
      href: '/admin/cashier',
      target: [tour('cashier-bill')],
      title: 'Settle the bill',
      body: 'Review the current bill, take cash or UPI, and print a receipt.',
    },
    {
      id: 'stations',
      path: '/station',
      href: '/station',
      target: [tour('station-list')],
      title: 'Kitchen stations',
      body: 'Each station gets its own display showing only its items. When a cook marks items ready, the customer’s ticket updates live.',
      fallback: 'Each station gets its own display showing only its items. No stations are active yet — add one in the stations table.',
    },
    {
      id: 'analytics',
      path: '/admin/analytics',
      href: '/admin/analytics',
      target: [tour('analytics-header')],
      title: 'Analytics',
      body: 'Sales, best-selling items and trends over time. Hover the ⓘ icons for how each number is worked out.',
    },
    {
      id: 'feedback',
      path: '/admin/feedback',
      href: '/admin/feedback',
      title: 'Customer feedback',
      body: 'Ratings and comments customers leave after an order land here. That’s the staff tour!',
      nextLabel: 'Finish',
    },
  ],
};

export const matchesPath = (step: TourStep, pathname: string) =>
  typeof step.path === 'string' ? step.path === pathname : step.path.test(pathname);

export const resolveCopy = (copy: Copy, ctx: TourContext) =>
  typeof copy === 'function' ? copy(ctx) : copy;
