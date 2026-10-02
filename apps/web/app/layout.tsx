import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DeepTechly",
  description: "Deep-tech research narratives and institutional intelligence dossiers.",
  openGraph: {
    title: "DeepTechly",
    description:
      "AI-native research for deep tech. Search companies, patents, labs, and emerging systems.",
    url: "/",
    siteName: "DeepTechly",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DeepTechly AI-native research for deep tech"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepTechly",
    description:
      "AI-native research for deep tech. Search companies, patents, labs, and emerging systems.",
    images: ["/og-image.jpg"]
  }
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
