"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="w-full overflow-x-hidden bg-background text-foreground">
      {/* ── Sticky Nav ── */}
      <header
        className={`sticky top-0 z-50 h-14 transition-all duration-200 ${
          scrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-zinc-200 shadow-sm"
            : "bg-white/0 border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Image
                src="/images/foresight-logo.png"
                alt=""
                width={22}
                height={22}
              />
            </span>
            <span className="font-heading text-[17px] font-bold tracking-tight text-zinc-900">
              Foresight
            </span>
          </Link>

          {/* Center: Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Auth */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Login
            </Link>
            <a
              href="mailto:vincent@foresight.edu"
              className="hidden sm:inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo + name */}
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                <Image
                  src="/images/foresight-logo.png"
                  alt=""
                  width={16}
                  height={16}
                />
              </span>
              <span className="text-sm font-semibold text-zinc-700">
                Foresight
              </span>
            </div>

            {/* Footer nav */}
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/features" className="hover:text-zinc-900 transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-zinc-900 transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="hover:text-zinc-900 transition-colors">
                About
              </Link>
              <a
                href="mailto:vincent@foresight.edu"
                className="hover:text-zinc-900 transition-colors"
              >
                Contact
              </a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-zinc-400">
              &copy; 2026 Foresight. All rights reserved.
            </p>
          </div>

          {/* Contact email */}
          <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-400">
              Questions? Reach us at{" "}
              <a
                href="mailto:vincent@foresight.edu"
                className="text-zinc-500 hover:text-zinc-900 underline underline-offset-2"
              >
                vincent@foresight.edu
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
