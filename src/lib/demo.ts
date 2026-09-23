// Optional public demo account, for people trying the app from the GitHub link.
// Set both vars to show a one-tap "Use demo account" button on the login page.
// Use a dedicated customer-role account — these values ship to the browser.
const email = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

export const DEMO_ACCOUNT = email && password ? { email, password } : null;

export const IS_DEMO = DEMO_ACCOUNT !== null;
