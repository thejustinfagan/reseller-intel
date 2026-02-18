import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reseller Intel - Service Center Intelligence Platform",
  description: "Comprehensive database of truck service centers, dealers, and parts suppliers with contact information and service capabilities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}