import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { preconnect } from "react-dom";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "B.N.M Cafe",
  description: "Your university cafe companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Open the connection to Supabase while the page is still parsing, so the
  // first auth/data request skips the DNS + TLS handshake.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    preconnect(process.env.NEXT_PUBLIC_SUPABASE_URL);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
