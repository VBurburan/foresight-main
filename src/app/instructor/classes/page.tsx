'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Users, BookOpen, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

function getScoreBadgeClasses(score: number): string {
  if (score >= 75) return 'bg-green-100 text-green-800 border border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-red-100 text-red-800 border border-red-200';
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
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-[#1e293b]/10 transition-colors"
      title="Copy enrollment code"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-600">Copied</span>
        </>
      ) : (
        <Copy className="h-3 w-3 text-[#1e293b]/60" />
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
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <Image src="/images/foresight-logo.png" alt="Foresight" width={36} height={36} />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-[#1e293b]">Classes</h1>
              <p className="text-sm font-medium text-[#334155]/60">Foresight by Path2Medic</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-amber-700 hover:bg-amber-600 shadow-sm">
                <Plus className="h-4 w-4" />
                Create New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-[#1e293b]">Create New Class</DialogTitle>
                <DialogDescription>
                  Set up a new course for your students. They will join using the auto-generated enrollment code.
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
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClass}
                  className="bg-amber-700 hover:bg-amber-600"
                  disabled={creating || !newClass.name.trim()}
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* Classes Table */}
        {classes.length === 0 ? (
          <Card className="border-dashed border-2 border-[#1e293b]/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e293b]/10 mb-4">
                <BookOpen className="h-8 w-8 text-[#1e293b]" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#1e293b]">
                No classes yet
              </h3>
              <p className="mt-2 text-center text-[#334155]/60 max-w-md">
                Create your first class to start tracking student progress. Students will join using an enrollment code.
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="mt-6 gap-2 bg-amber-700 hover:bg-amber-600"
              >
                <Plus className="h-4 w-4" />
                Create Your First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">
                  All Classes
                </CardTitle>
                <CardDescription>
                  {classes.length} class{classes.length !== 1 ? 'es' : ''} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-[#1e293b]">Class Name</TableHead>
                      <TableHead className="font-semibold text-[#1e293b]">Cert Level</TableHead>
                      <TableHead className="text-center font-semibold text-[#1e293b]">Students</TableHead>
                      <TableHead className="text-center font-semibold text-[#1e293b]">Avg Score</TableHead>
                      <TableHead className="font-semibold text-[#1e293b]">Enrollment Code</TableHead>
                      <TableHead className="text-center font-semibold text-[#1e293b]">Status</TableHead>
                      <TableHead className="text-right font-semibold text-[#1e293b]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls, idx) => (
                      <motion.tr
                        key={cls.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b transition-colors hover:bg-slate-50"
                      >
                        <TableCell className="font-medium text-[#334155]">
                          {cls.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {cls.certification_level || 'All'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-[#334155]/50" />
                            <span className="text-[#334155]">{cls.studentCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {cls.avgScore != null ? (
                            <Badge className={getScoreBadgeClasses(cls.avgScore)}>
                              {cls.avgScore}%
                            </Badge>
                          ) : (
                            <span className="text-[#334155]/40">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cls.enrollment_code && (
                            <div className="flex items-center gap-1">
                              <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-[#1e293b]">
                                {cls.enrollment_code}
                              </code>
                              <CopyButton text={cls.enrollment_code} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              cls.is_active !== false
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }
                          >
                            {cls.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/instructor/classes/${cls.id}`}>
                            <Button size="sm" variant="outline" className="text-[#1e293b] border-[#1e293b]/30 hover:bg-[#1e293b]/5">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
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
