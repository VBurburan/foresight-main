"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CertLevel = "EMT" | "AEMT" | "Paramedic";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [certLevel, setCertLevel] = useState<CertLevel | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          institution,
          certification_level: certLevel || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setDone(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] px-4">
        <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-elevation-2 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h1>
          <p className="text-sm text-zinc-500 mb-6">
            We sent a confirmation link to <span className="font-medium text-zinc-700">{email}</span>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex flex-col items-center gap-3 mb-8 group">
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
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-elevation-2 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900">Create your account</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Set up your institution&apos;s Foresight workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm text-zinc-700 font-medium">
              Full name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Dr. Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-blue-500/40 focus:border-blue-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="institution" className="text-sm text-zinc-700 font-medium">
              Institution name
            </Label>
            <Input
              id="institution"
              type="text"
              placeholder="Riverside Community College"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-blue-500/40 focus:border-blue-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certLevel" className="text-sm text-zinc-700 font-medium">
              Program focus
            </Label>
            <Select value={certLevel} onValueChange={(v) => setCertLevel(v as CertLevel)}>
              <SelectTrigger
                id="certLevel"
                className="bg-white border-zinc-300 text-zinc-900 h-11 focus:ring-blue-500/40 focus:border-blue-500"
              >
                <SelectValue placeholder="Select certification level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMT">EMT</SelectItem>
                <SelectItem value="AEMT">AEMT</SelectItem>
                <SelectItem value="Paramedic">Paramedic</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-blue-500/40 focus:border-blue-500 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm text-zinc-700 font-medium">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
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
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-100 text-center">
          <p className="text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
