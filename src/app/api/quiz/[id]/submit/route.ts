import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'

// POST /api/quiz/[id]/submit — grade a quiz attempt
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const { enrollmentId, answers } = await parseBody<{ enrollmentId: string; answers: Record<string, unknown> }>(req)

  const { data: quiz, error } = await supabase
    .from(T.Quiz)
    .select('*, questions:Question(*)')
    .eq('id', id)
    .single()
  if (error || !quiz) return fail('Kuiz tidak dijumpai', 404)

  const { data: enr, error: enrErr } = await supabase
    .from(T.Enrollment)
    .select('id, userId, courseId, campusId')
    .eq('id', enrollmentId)
    .single()
  if (enrErr || !enr || enr.userId !== user.id) return fail('Pendaftaran tidak sah', 403)

  // Count existing attempts
  const { count: attemptCount } = await supabase
    .from(T.QuizAttempt)
    .select('id', { count: 'exact', head: true })
    .eq('quizId', id)
    .eq('userId', user.id)
  if ((attemptCount || 0) >= quiz.maxAttempts) return fail(`Anda telah mencapai had percubaan (${quiz.maxAttempts})`, 400)

  // Grade
  let score = 0
  let maxScore = 0
  for (const q of (quiz.questions || [])) {
    maxScore += q.marks
    const userAns = answers[q.id]
    const correct = q.correctAnswer
    let isCorrect = false
    if (q.type === 'mcq') {
      const correctArr = Array.isArray(correct) ? correct : [correct]
      const userArr = Array.isArray(userAns) ? userAns : [userAns]
      isCorrect = correctArr.length === userArr.length && correctArr.every((c: string) => userArr.includes(c))
    } else if (q.type === 'true_false') {
      isCorrect = String(userAns).toLowerCase() === String(correct).toLowerCase()
    } else if (q.type === 'fill_blank') {
      isCorrect = String(userAns).trim().toLowerCase() === String(correct).trim().toLowerCase()
    } else {
      // essay — auto pass with 70%
      isCorrect = true
      score += q.marks * 0.7
      continue
    }
    if (isCorrect) score += q.marks
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const passed = percentage >= quiz.passMark

  const attemptId = crypto.randomUUID()
  const { data: attempt } = await supabase.from(T.QuizAttempt).insert({
    id: attemptId, quizId: id, enrollmentId, userId: user.id,
    answers,
    score: Math.round(score * 10) / 10, maxScore, percentage, passed,
    submittedAt: new Date().toISOString(),
  }).select().single()

  // Update enrollment final score + points
  await supabase.from(T.Enrollment).update({ finalScore: percentage }).eq('id', enrollmentId)
  await supabase.from(T.User).update({ points: (user.points || 0) + (passed ? 50 : 15) }).eq('id', user.id)

  // Auto-issue certificate if quiz passed + enrollment near complete
  if (passed) {
    const { data: enrFresh } = await supabase
      .from(T.Enrollment)
      .select('*, course:Course(*, modules:Module(*, contents:Content(id)))')
      .eq('id', enrollmentId)
      .single()
    if (enrFresh) {
      const total = (enrFresh.course?.modules || []).flatMap((m: any) => m.contents || []).length || 1
      const { count: completedCount } = await supabase
        .from(T.Progress)
        .select('id', { count: 'exact', head: true })
        .eq('enrollmentId', enrollmentId)
        .eq('status', 'completed')
      const pct = Math.round(((completedCount || 0) / total) * 100)
      if (pct >= 80) {
        const { data: existingCert } = await supabase
          .from(T.Certificate)
          .select('id')
          .eq('enrollmentId', enrollmentId)
          .maybeSingle()
        if (!existingCert) {
          const { count: certCount } = await supabase
            .from(T.Certificate)
            .select('id', { count: 'exact', head: true })
          const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 75 ? 'A-' : percentage >= 70 ? 'B+' : percentage >= 65 ? 'B' : 'Lulus'
          await supabase.from(T.Certificate).insert({
            id: crypto.randomUUID(),
            certNumber: `JTM-2026-${String((certCount || 0) + 1).padStart(5, '0')}`,
            userId: user.id, courseId: enrFresh.courseId, campusId: enrFresh.campusId,
            enrollmentId, verifyCode: `JTM-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
            title: `Sijil Penyiapan Kursus — ${enrFresh.course?.title}`,
            recipientName: user.name, recipientIc: user.icNumber,
            score: percentage, grade, issuedAt: new Date().toISOString(),
            status: 'valid', signature: 'Jabatan Tenaga Manusia (JTM)',
          })
          await supabase.from(T.Enrollment).update({ status: 'completed', completedAt: new Date().toISOString() }).eq('id', enrollmentId)
          await supabase.from(T.Notification).insert({
            userId: user.id, type: 'certificate',
            title: 'Sijil Digital Diterbitkan',
            message: `Tahniah! Sijil untuk "${enrFresh.course?.title}" telah dijana. Boleh disahkan via QR.`,
            link: '/certificates',
          })
          await supabase.from(T.User).update({ points: (user.points || 0) + 100 }).eq('id', user.id)
        }
      }
    }
  }

  return ok({ attempt })
}
