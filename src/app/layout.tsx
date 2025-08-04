import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ColorModeScript } from '@chakra-ui/react';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Daily Prompt Wall",
  description: "A creative community platform for daily artistic prompts and submissions",
  keywords: ["art", "creativity", "prompts", "community", "daily", "drawing", "photography", "writing"],
  authors: [{ name: "Daily Prompt Wall Team" }],
  openGraph: {
    title: "Daily Prompt Wall",
    description: "Join our creative community and respond to daily artistic prompts",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorModeScript initialColorMode="dark" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
