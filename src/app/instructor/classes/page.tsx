'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface ClassRow {
  id: string;
  name: string;
  certification_level: string | null;
  enrollment_code: string | null;
  is_active: boolean | null;
  created_at: string;
  studentCount: number;
  avgScore: number | null;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCopy(); }}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-zinc-100"
      title="Copy enrollment code"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 text-zinc-400" />
      )}
    </button>
  );
}

function ClassesContent() {
  const { user } = useUser();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    certLevel: 'Paramedic',
    description: '',
    maxStudents: 20,
  });

  const fetchClasses = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const { data: instructor } = await supabase
      .from('instructors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!instructor) {
      setLoading(false);
      return;
    }
    setInstructorId(instructor.id);

    const { data: classData } = await supabase
      .from('classes')
      .select('id, name, certification_level, enrollment_code, is_active, created_at')
      .eq('instructor_id', instructor.id)
      .order('created_at', { ascending: false });

    if (!classData || classData.length === 0) {
      setClasses([]);
      setLoading(false);
      return;
    }

    const classIds = classData.map((c) => c.id);

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id, student_id')
      .in('class_id', classIds);

    const enrollCountMap: Record<string, string[]> = {};
    (enrollments ?? []).forEach((e) => {
      if (!enrollCountMap[e.class_id]) enrollCountMap[e.class_id] = [];
      enrollCountMap[e.class_id].push(e.student_id);
    });

    const allStudentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
    const studentAvgMap: Record<string, number> = {};

    if (allStudentIds.length > 0) {
      const { data: sessions } = await supabase
        .from('exam_sessions')
        .select('student_id, score_percentage')
        .in('student_id', allStudentIds)
        .not('score_percentage', 'is', null);

      const studentScores: Record<string, number[]> = {};
      (sessions ?? []).forEach((s) => {
        if (s.score_percentage != null) {
          if (!studentScores[s.student_id]) studentScores[s.student_id] = [];
          studentScores[s.student_id].push(s.score_percentage);
        }
      });

      Object.entries(studentScores).forEach(([sid, scores]) => {
        studentAvgMap[sid] = scores.reduce((a, b) => a + b, 0) / scores.length;
      });
    }

    const rows: ClassRow[] = classData.map((c) => {
      const studentIds = enrollCountMap[c.id] ?? [];
      const classScores = studentIds
        .filter((sid) => studentAvgMap[sid] !== undefined)
        .map((sid) => studentAvgMap[sid]);
      const avg =
        classScores.length > 0
          ? Math.round(classScores.reduce((a, b) => a + b, 0) / classScores.length)
          : null;

      return {
        id: c.id,
        name: c.name,
        certification_level: c.certification_level,
        enrollment_code: c.enrollment_code,
        is_active: c.is_active,
        created_at: c.created_at,
        studentCount: studentIds.length,
        avgScore: avg,
      };
    });

    setClasses(rows);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async () => {
    if (!instructorId || !newClass.name.trim()) return;
    setCreating(true);

    const supabase = createClient();
    const code = newClass.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase() + Math.floor(Math.random() * 100);

    await supabase.from('classes').insert({
      instructor_id: instructorId,
      name: newClass.name.trim(),
      certification_level: newClass.certLevel as any,
      description: newClass.description.trim() || null,
      max_students: newClass.maxStudents,
      enrollment_code: code,
      is_active: true,
    });

    setNewClass({ name: '', certLevel: 'Paramedic', description: '', maxStudents: 20 });
    setIsDialogOpen(false);
    setCreating(false);
    setLoading(true);
    fetchClasses();
  };

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-8 w-48 rounded-md bg-zinc-100 animate-pulse" />
          <div className="h-64 rounded-xl bg-zinc-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Classes</h1>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-white hover:bg-zinc-100 text-zinc-900">
                <Plus className="h-4 w-4" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Set up a new course. Students join using the auto-generated enrollment code.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="class-name">Class Name</Label>
                  <Input
                    id="class-name"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="e.g., Paramedic 2026 Cohort A"
                    className="bg-surface-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-level">Certification Level</Label>
                  <Select
                    value={newClass.certLevel}
                    onValueChange={(value) => setNewClass({ ...newClass, certLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMT">EMT-Basic</SelectItem>
                      <SelectItem value="AEMT">AEMT</SelectItem>
                      <SelectItem value="Paramedic">Paramedic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    placeholder="Course details and goals..."
                    rows={3}
                    className="bg-surface-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-students">Max Students</Label>
                  <Input
                    id="max-students"
                    type="number"
                    value={newClass.maxStudents}
                    onChange={(e) =>
                      setNewClass({ ...newClass, maxStudents: parseInt(e.target.value) || 20 })
                    }
                    className="bg-surface-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="glass-card text-zinc-600 hover:text-zinc-900"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClass}
                  className="bg-white hover:bg-zinc-100 text-zinc-900"
                  disabled={creating || !newClass.name.trim()}
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes Table */}
        {classes.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
            <div className="surface-2 rounded-full p-4 mb-4">
              <Plus className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600">No classes yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              Create your first class to start tracking student progress.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 gap-2 bg-white hover:bg-zinc-100 text-zinc-900"
            >
              <Plus className="h-4 w-4" />
              Create Class
            </Button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-200">
                  <TableHead className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Class Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Cert Level</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Students</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Avg Score</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Enrollment Code</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-zinc-400 font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id} className="border-zinc-200 hover:bg-zinc-800/30">
                    <TableCell className="font-medium text-zinc-900">
                      {cls.name}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {cls.certification_level || 'All'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-zinc-400">
                      {cls.studentCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {cls.avgScore != null ? (
                        <span className={`text-sm font-medium ${scoreColor(cls.avgScore)}`}>
                          {cls.avgScore}%
                        </span>
                      ) : (
                        <span className="text-zinc-9000">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cls.enrollment_code && (
                        <div className="flex items-center gap-1">
                          <code className="rounded surface-2 px-2 py-0.5 text-xs font-mono text-zinc-600">
                            {cls.enrollment_code}
                          </code>
                          <CopyButton text={cls.enrollment_code} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            cls.is_active !== false ? 'bg-emerald-400' : 'bg-zinc-600'
                          }`}
                        />
                        {cls.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/instructor/classes/${cls.id}`}>
                        <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-900">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  return (
    <InstructorGuard>
      <ClassesContent />
    </InstructorGuard>
  );
}
