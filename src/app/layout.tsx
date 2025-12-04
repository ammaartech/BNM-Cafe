import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`font-sans antialiased ${inter.variable} bg-background`}>
        <div className="max-w-md mx-auto bg-card min-h-screen flex flex-col shadow-2xl">
            <FirebaseClientProvider>
                {children}
            </FirebaseClientProvider>
            <Toaster />
        </div>
      </body>
    </html>
  );
}
