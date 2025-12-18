import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "../providers/AuthProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import QueryProvider from "@/providers/QueryProvider";
import SmoothScroll from "@/components/SmoothScroll";
import ReportBugButton from "@/components/ReportBugButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JBlog - Modern Blogging Platform",
    template: "%s | JBlog",
  },
  description: "Platform blogging modern dengan fitur lengkap untuk berbagi ide, pengalaman, dan pengetahuan.",
  keywords: ["blog", "blogging", "platform", "jblog", "writing", "content"],
  authors: [{ name: "JBlog Team" }],
  creator: "JBlog",
  publisher: "JBlog",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "JBlog",
    title: "JBlog - Modern Blogging Platform",
    description: "Platform blogging modern dengan fitur lengkap untuk berbagi ide, pengalaman, dan pengetahuan.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JBlog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JBlog - Modern Blogging Platform",
    description: "Platform blogging modern dengan fitur lengkap untuk berbagi ide, pengalaman, dan pengetahuan.",
    creator: "@jblog",
    site: "@jblog",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          enableSystem
          disableTransitionOnChange
          defaultTheme="system"
          storageKey="jblog-theme"
        >
          <Toaster
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "2px solid hsl(var(--primary))",
                borderRadius: "0.75rem",
                padding: "1.25rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                minWidth: "300px",
                maxWidth: "500px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              },
              success: {
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: "500",
                  minWidth: "300px",
                  maxWidth: "500px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                },
                iconTheme: {
                  primary: "hsl(var(--primary))",
                  secondary: "hsl(var(--card))",
                },
              },
              error: {
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "2px solid hsl(var(--destructive))",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: "500",
                  minWidth: "300px",
                  maxWidth: "500px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                },
                iconTheme: {
                  primary: "hsl(var(--destructive))",
                  secondary: "hsl(var(--card))",
                },
              },
              loading: {
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: "500",
                  minWidth: "300px",
                  maxWidth: "500px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                },
                iconTheme: {
                  primary: "hsl(var(--primary))",
                  secondary: "hsl(var(--card))",
                },
              },
            }}
            reverseOrder={false}
            position="top-center"
            containerStyle={{
              top: 20,
            }}
          />
          <QueryProvider>
            <SmoothScroll>
              <AuthProvider>
                {children}
                <ReportBugButton />
              </AuthProvider>
            </SmoothScroll>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
