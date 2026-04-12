"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { DotPattern } from "@/components/ui/dot-pattern";

export default function LoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-slate-400 text-sm">Loading...</p>
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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <DotPattern
        width={24}
        height={24}
        cr={1}
        className="fill-slate-200/60 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
      />

      {/* Logo + Wordmark */}
      <div className="relative z-10 flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
          <Image
            src="/images/foresight-logo.png"
            alt="Foresight"
            width={32}
            height={32}
          />
        </div>
        <span className="text-xl font-semibold text-slate-900 tracking-tight">
          Foresight
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-slate-700">
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
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-slate-700">
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
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-10"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-5">
          Students: use credentials from your instructor
        </p>
      </div>

      {/* Below card */}
      <div className="relative z-10 mt-6">
        <a
          href="mailto:vincent@path2medic.com"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Need access? Contact us
        </a>
      </div>
    </div>
  );
}
