"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function StudentSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: FileText, label: "My Exams", href: "/student/exams" },
    { icon: BarChart3, label: "Results", href: "/student/results" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Foresight Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white/90 flex items-center justify-center">
            <Image
              src="/images/foresight-logo.png"
              alt="Foresight"
              width={34}
              height={34}
            />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-white">Foresight</p>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-all text-sm",
                isActive
                  ? "bg-white/10 text-[#93c5fd] border-l-[3px] border-[#93c5fd] pl-[9px]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-[18px] h-[18px]" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info and Sign Out */}
      <div className="border-t border-white/10 p-4">
        {user && (
          <div className="mb-3 text-xs text-slate-400 truncate">
            {user.email}
          </div>
        )}
        <Button
          variant="outline"
          className="w-full justify-start text-slate-300 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-sm"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#1B4F72] text-white flex-col border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1B4F72] text-white flex items-center justify-between px-4 z-40 border-b border-white/10">
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white/90 flex items-center justify-center">
            <Image
              src="/images/foresight-logo.png"
              alt="Foresight"
              width={22}
              height={22}
            />
          </div>
          <span className="text-sm font-bold">Foresight</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <aside className="fixed inset-0 top-16 z-30 w-60 bg-[#1B4F72] text-white flex flex-col md:hidden">
          <SidebarContent />
        </aside>
      )}
    </>
  );
}
