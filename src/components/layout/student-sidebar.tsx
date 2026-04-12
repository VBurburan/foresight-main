"use client";

import { useState } from "react";
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
import { useUser } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
  { icon: FileText, label: "Exams", href: "/student/exams" },
  { icon: BarChart3, label: "Results", href: "/student/results" },
];

export function StudentSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Image
              src="/images/foresight-logo.png"
              alt="Foresight"
              width={20}
              height={20}
            />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white leading-none tracking-tight">
              Foresight
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 font-medium">
              Student
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-100",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-zinc-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 mt-auto border-t border-white/[0.08]">
        {user && (
          <p className="text-[11px] text-zinc-500 truncate mb-3">{user.email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — dark */}
      <aside className="hidden md:flex w-[220px] bg-[#111113] flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#111113] flex items-center justify-between px-4 z-40 border-b border-white/[0.06]">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-zinc-400">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <Image src="/images/foresight-logo.png" alt="Foresight" width={14} height={14} />
          </div>
          <span className="text-sm font-semibold text-white">Foresight</span>
        </div>
        <div className="w-5" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 top-14 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-14 left-0 bottom-0 z-40 w-[220px] bg-[#111113] flex flex-col md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
