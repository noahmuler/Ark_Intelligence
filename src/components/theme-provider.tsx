"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // After hydration, next-themes manages the class. The inline <style> in layout.tsx
    // already set the correct background. We just need to make sure the class is correct.
    // No DOM manipulation needed — the CSS classes in globals.css + the inline style handle it.
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={true}
      storageKey="ark-theme"
      themes={["dark", "light"]}
    >
      {children}
    </ThemeProvider>
  );
}
