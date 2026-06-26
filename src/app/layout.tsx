import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeInitScript from "@/components/ThemeInitScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JojobaWorks",
  description:
    "Digital logbook and maintenance feed for the JojobaWorks maintenance department at Jojoba Hills SKP Resort.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "JojobaWorks",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/assets/logo_quail_wht.jpg",
    apple: "/assets/logo_quail_wht.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2d6a47" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeInitScript />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
