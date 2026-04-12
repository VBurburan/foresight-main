import { AuthProvider } from "@/components/auth/auth-provider";
import { StudentSidebar } from "@/components/layout/student-sidebar";

export const dynamic = 'force-dynamic';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-slate-50">
        <StudentSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
