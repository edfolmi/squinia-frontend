import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squinia",
  description: "Human performance training simulations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
