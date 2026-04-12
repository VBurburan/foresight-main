import { AuthProvider } from "@/components/auth/auth-provider";
import { ForesightSidebar } from "@/components/layout/foresight-sidebar";

export const dynamic = 'force-dynamic';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-slate-50">
        <ForesightSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
