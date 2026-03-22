import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"]
});

export const metadata: Metadata = {
  title: "Torino Job Radar",
  description: "MVP per monitorare offerte lavoro a Torino, Italia."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${bodyFont.variable} ${displayFont.variable} font-[var(--font-body)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
