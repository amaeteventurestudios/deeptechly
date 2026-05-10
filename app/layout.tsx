import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepTechly",
  description: "Deep-tech research narratives and institutional intelligence dossiers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
