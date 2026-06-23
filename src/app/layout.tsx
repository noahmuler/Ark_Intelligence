import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProviderWrapper } from "@/components/theme-provider";
import { ConvexProviderWrapper } from "@/components/convex-provider";
import { QueryProvider } from "@/components/query-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('ark-theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored : 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
