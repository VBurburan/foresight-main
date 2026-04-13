"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
          <p className="text-zinc-400 text-sm">Loading...</p>
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
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] px-4">
      {/* Logo + Wordmark — links back to marketing site */}
      <Link href="/" className="relative z-10 flex flex-col items-center gap-3 mb-8 group">
        <div className="w-14 h-14 rounded-xl bg-white border border-zinc-200 p-3 shadow-elevation-2 flex items-center justify-center">
          <Image
            src="/images/foresight-logo.png"
            alt="Foresight"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight font-heading group-hover:text-zinc-600 transition-colors">
            Foresight
          </h2>
          <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-widest font-medium">
            Assessment Platform
          </p>
        </div>
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-elevation-2 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-zinc-700 font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-blue-500/40 focus:border-blue-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-zinc-700 font-medium">
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
              className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-blue-500/40 focus:border-blue-500 h-11"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium h-11 transition-colors"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 text-center">
            Students: use credentials provided by your instructor
          </p>
        </div>
      </div>

      {/* Below card */}
      <div className="relative z-10 mt-6">
        <a
          href="mailto:hello@foresight.edu"
          className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Need access? Contact us
        </a>
      </div>
    </main>
  );
}
