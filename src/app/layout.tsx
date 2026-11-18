import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { TopNav } from "@/components/Nav";
import { AiProvider } from "@/lib/ai";

const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "SamePage",
  description: "Team check-ins, discussion trainings and growth tracking",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#10262f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${plex.variable} antialiased`}>
        <StoreProvider>
          <AiProvider>
            <TopNav />
            <div className="pb-24 md:pb-12">{children}</div>
          </AiProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
