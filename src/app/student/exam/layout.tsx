export default function ExamLayout({ children }: { children: React.ReactNode }) {
  // Override parent student layout — no sidebar during exams
  // The exam page provides its own full-screen chrome (navy header, fixed footer)
  return (
    <div className="fixed inset-0 z-[60] bg-[#f0f2f5] overflow-auto">
      {children}
    </div>
  );
}
