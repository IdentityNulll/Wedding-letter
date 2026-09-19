import type { Metadata } from "next";
import { Cormorant_Garamond, PT_Serif, Marck_Script } from "next/font/google";
import "./globals.css";

// Every face here carries BOTH Latin and Cyrillic. That constraint rules out
// most blackletter/calligraphic display fonts, so the medieval feel comes from
// the ornaments and layout instead — not from an unreadable typeface.
const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = PT_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const script = Marck_Script({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Taklifnoma",
  description: "Onlayn to'y taklifnomalari",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
