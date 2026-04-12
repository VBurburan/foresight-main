"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Shield, BarChart3, FileText } from "lucide-react";

export default function LoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Query the students table for the user's role
      const { data: studentRecord } = await supabase
        .from("students")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      const role = studentRecord?.role;
      const isInstructor = role === "instructor" || role === "admin";

      // Determine destination based on role
      const defaultDest = isInstructor ? "/instructor/dashboard" : "/student/dashboard";
      const dest = redirect || defaultDest;
      router.push(dest);

      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Foresight Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1B4F72] to-[#0f2940] text-white flex-col justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-white/90 flex items-center justify-center">
              <Image
                src="/images/foresight-logo.png"
                alt="Foresight"
                width={32}
                height={32}
              />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">Foresight</p>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Assessment Platform</p>
            </div>
          </Link>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold leading-tight">
            Institutional Assessment
            <br />
            Platform for EMS
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed max-w-md">
            Build and take real TEI assessments, track analytics, and stay accreditation-ready.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Shield,
                text: "Build & take real TEI assessments",
              },
              {
                icon: BarChart3,
                text: "Track cohort & individual analytics",
              },
              {
                icon: FileText,
                text: "CoAEMSP accreditation tracking",
              },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-[#93c5fd]" />
                </div>
                <span className="text-sm text-gray-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            &copy; 2026 Foresight. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center">
                <Image
                  src="/images/foresight-logo.png"
                  alt="Foresight"
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Foresight</p>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase">Assessment Platform</p>
              </div>
            </Link>
          </div>

          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl font-bold text-[#1B4F72]">Welcome to Foresight</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-1.5"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1B4F72] hover:bg-[#164163] text-white font-semibold h-11"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Students: use the credentials from your instructor
              </p>
              <a
                href="mailto:vincent@path2medic.com"
                className="text-xs text-[#1B4F72] hover:underline mt-1 inline-block"
              >
                Need access? Contact us
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
