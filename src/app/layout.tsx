import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { TopNav } from "@/components/Nav";
import { AiProvider } from "@/lib/ai";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SamePage",
  description: "AI-powered team trainings from anonymous daily check-ins",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <StoreProvider>
          <AiProvider>
            <TopNav />
            <div className="pb-24 md:pb-10">{children}</div>
          </AiProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
