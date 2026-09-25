import { redirect } from "next/navigation";

// Redirect on the server, so the first byte is already the login page instead
// of a spinner that waits for JavaScript to redirect.
export default function RootPage() {
  redirect("/login");
}
