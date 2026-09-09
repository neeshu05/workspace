import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Warehouse",
  description: "Real-time warehouse operations dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
