"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  BookOpen,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useUser } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/instructor/dashboard" },
  { icon: Users, label: "Classes", href: "/instructor/classes" },
  { icon: FileText, label: "Test Builder", href: "/instructor/test-builder" },
  { icon: BarChart3, label: "Analytics", href: "/instructor/analytics" },
  { icon: BookOpen, label: "TEI Reference", href: "/instructor/examples" },
];

export function ForesightSidebar() {
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
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center">
            <Image
              src="/images/foresight-logo.png"
              alt="Foresight"
              width={24}
              height={24}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-none">
              Foresight
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              Instructor
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
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-slate-700" : "text-slate-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 mt-auto border-t border-slate-100">
        {user && (
          <p className="text-xs text-slate-400 truncate mb-3">{user.email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white flex-col border-r border-slate-200">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white flex items-center justify-between px-4 z-40 border-b border-slate-200">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-600"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <Image
            src="/images/foresight-logo.png"
            alt="Foresight"
            width={20}
            height={20}
          />
          <span className="text-sm font-semibold text-slate-900">Foresight</span>
        </div>
        <div className="w-5" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-14 bg-black/20 z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-14 left-0 bottom-0 z-40 w-56 bg-white border-r border-slate-200 flex flex-col md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
