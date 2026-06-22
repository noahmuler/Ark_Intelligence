import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProviderWrapper } from "@/components/theme-provider";
import { ConvexProviderWrapper } from "@/components/convex-provider";
import { QueryProvider } from "@/components/query-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Dark background applied BEFORE body renders — prevents white flash */}
        <style>{`
          html, body {
            background-color: #0f0f23 !important;
            color: #ffffff !important;
          }
          html.light, html.light body {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
        `}</style>
      </head>
      <body className={`${inter.variable} min-h-full flex flex-col font-sans`}>
        <QueryProvider>
          <ConvexProviderWrapper>
            <ThemeProviderWrapper>
              {children}
            </ThemeProviderWrapper>
          </ConvexProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
