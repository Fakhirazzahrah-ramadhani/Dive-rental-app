import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./cart-context";
import FloatingCartButton from "./floating-cart-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dive Rental | Sewa Perlengkapan Selam",
  description: "Pilih perlengkapan selam, tentukan periode sewa, dan kelola booking Anda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <Suspense fallback={null}>
            <FloatingCartButton />
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}