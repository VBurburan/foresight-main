import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "@/app/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Foresight",
    default: "Foresight — Institutional EMS Assessment Platform",
  },
  description:
    "The first institutional assessment platform with real NREMT TEI formats. Cohort analytics, AI-powered test builder, and accreditation tracking for EMS education programs.",
  openGraph: {
    title: "Foresight — Institutional EMS Assessment Platform",
    description:
      "The first institutional assessment platform with real NREMT TEI formats. Cohort analytics, AI-powered test builder, and accreditation tracking for EMS education programs.",
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
    <html lang="en">
      <body
        className={`${montserrat.variable} ${openSans.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
