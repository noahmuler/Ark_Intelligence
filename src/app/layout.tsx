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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('ark-theme');var d=true;if(t==='light')d=false;else if(t!=='dark')d=window.matchMedia('(prefers-color-scheme: dark)').matches;var s=document.documentElement;s.classList.add(d?'dark':'light');s.style.colorScheme=d?'dark':'light';var c=document.createElement('style');c.textContent='html,body{background-color:'+(d?'#0f0f23':'#f8fafc')+'!important;color:'+(d?'#ffffff':'#0f172a')+'!important}';document.head.appendChild(c)})();`,
          }}
        />
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
