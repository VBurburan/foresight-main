import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Foresight",
    default: "Foresight — Assessment Infrastructure for EMS Programs",
  },
  description:
    "Build NREMT-style TEI assessments, track cohort analytics, and identify at-risk students. The assessment platform built for EMS educators.",
  openGraph: {
    title: "Foresight — Assessment Infrastructure for EMS Programs",
    description:
      "Build NREMT-style TEI assessments, track cohort analytics, and identify at-risk students.",
    type: "website",
    siteName: "Foresight",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${manrope.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
