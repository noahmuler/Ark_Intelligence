"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Script to prevent theme flash - runs before React hydration
const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.add(theme);
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} min-h-full flex flex-col font-sans`}>
        <ConvexProvider client={convex}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
