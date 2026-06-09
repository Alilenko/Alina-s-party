import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Dancing_Script, Montserrat } from "next/font/google";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const bodyFont = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

const scriptFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Alina's Party",
  description: "Свято починається тут",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f1416",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uk"
      className={`${displayFont.variable} ${bodyFont.variable} ${scriptFont.variable}`}
      suppressHydrationWarning
    >
      <body className={`${bodyFont.className} antialiased`} suppressHydrationWarning>
        <div className="mx-auto min-h-dvh max-w-[767px] bg-party-bg shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
