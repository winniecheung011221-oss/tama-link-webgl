import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "TAMA LINK — Digital Companion",
  description: "A WebGL virtual pet experience where care becomes a signal.",
  openGraph: {
    title: "TAMA LINK — Digital Companion",
    description: "Care is a signal.",
    images: [{ url: "/og.webp", width: 1200, height: 630, alt: "TAMA LINK digital companion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TAMA LINK — Digital Companion",
    description: "Care is a signal.",
    images: ["/og.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
