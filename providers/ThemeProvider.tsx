"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) => {
  return (
    <NextThemesProvider
      {...props}
      storageKey="jblog-theme"
      enableSystem
      attribute="class"
    >
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
