"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-zinc-500 text-sm">Loading...</p>
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
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_60%)]" />

      {/* Logo + Wordmark */}
      <div className="relative z-10 flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-xl bg-white p-3 shadow-glow-blue flex items-center justify-center">
          <Image
            src="/images/foresight-logo.png"
            alt="Foresight"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-xl font-semibold text-white tracking-tight">
          Foresight
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm glass-card ring-1 ring-white/[0.08] p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Sign in</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-zinc-300">
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
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-blue-500/40 focus:border-blue-500/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-zinc-300">
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
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-blue-500/40 focus:border-blue-500/40"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-medium h-10"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-xs text-zinc-500 text-center mt-5">
          Students: use credentials from your instructor
        </p>
      </div>

      {/* Below card */}
      <div className="relative z-10 mt-6">
        <a
          href="mailto:vincent@foresight.edu"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Need access? Contact us
        </a>
      </div>
    </main>
  );
}
