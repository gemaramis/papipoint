import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papipoint - AI Presentation Redesign",
  description: "Redesign your .pptx presentations with AI in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
