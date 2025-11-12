import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Navigation, DesktopSidebar } from "@/components/layout/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CCS Sales Coach - Ceylon Cold Stores",
  description: "AI-powered sales coaching and insights for DSRs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <DesktopSidebar />
            <main className="flex-1 md:ml-64 pb-16 md:pb-0">
              {children}
            </main>
          </div>
          <Navigation />
        </div>
      </body>
    </html>
  );
}
