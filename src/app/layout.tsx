import { Inter } from "next/font/google";
import Script from "next/script";
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
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try{
    var stored=localStorage.getItem('ark-theme');
    var theme=stored&&(stored==='dark'||stored==='light')?stored:'dark';
    document.documentElement.classList.remove('light','dark');
    document.documentElement.classList.add(theme);
  }catch(e){
    document.documentElement.classList.add('dark');
  }
})();`,
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
