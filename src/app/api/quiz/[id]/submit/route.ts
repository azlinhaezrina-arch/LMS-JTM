import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody, parseJson } from '@/lib/api'

// POST /api/quiz/[id]/submit — grade a quiz attempt
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const { enrollmentId, answers } = await parseBody<{ enrollmentId: string; answers: Record<string, unknown> }>(req)

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: { questions: true },
  })
  if (!quiz) return fail('Kuiz tidak dijumpai', 404)

  const enr = await db.enrollment.findUnique({ where: { id: enrollmentId } })
  if (!enr || enr.userId !== user.id) return fail('Pendaftaran tidak sah', 403)

  // Count existing attempts
  const attemptCount = await db.quizAttempt.count({ where: { quizId: id, userId: user.id } })
  if (attemptCount >= quiz.maxAttempts) return fail(`Anda telah mencapai had percubaan (${quiz.maxAttempts})`, 400)

  // Grade
  let score = 0
  let maxScore = 0
  for (const q of quiz.questions) {
    maxScore += q.marks
    const userAns = answers[q.id]
    const correct = parseJson<string | string[]>(q.correctAnswer, '')
    let isCorrect = false
    if (q.type === 'mcq') {
      const correctArr = Array.isArray(correct) ? correct : [correct]
      const userArr = Array.isArray(userAns) ? userAns : [userAns]
      isCorrect = correctArr.length === userArr.length && correctArr.every((c) => userArr.includes(c))
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

  const attempt = await db.quizAttempt.create({
    data: {
      quizId: id, enrollmentId, userId: user.id,
      answers: JSON.stringify(answers),
      score: Math.round(score * 10) / 10, maxScore, percentage, passed,
      submittedAt: new Date(),
    },
  })

  // Update enrollment final score + points
  await db.enrollment.update({
    where: { id: enrollmentId },
    data: { finalScore: percentage },
  })
  await db.user.update({
    where: { id: user.id },
    data: { points: { increment: passed ? 50 : 15 } },
  })

  // Auto-issue certificate if quiz passed + enrollment was near complete
  if (passed) {
    const enrFresh = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: { include: { modules: { include: { contents: true } } } } },
    })
    if (enrFresh) {
      const total = enrFresh.course.modules.flatMap((m) => m.contents).length || 1
      const completed = await db.progress.count({ where: { enrollmentId, status: 'completed' } })
      const pct = Math.round((completed / total) * 100)
      if (pct >= 80) {
        const existing = await db.certificate.findUnique({ where: { enrollmentId } })
        if (!existing) {
          const certCount = await db.certificate.count()
          const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 75 ? 'A-' : percentage >= 70 ? 'B+' : percentage >= 65 ? 'B' : 'Lulus'
          await db.certificate.create({
            data: {
              certNumber: `JTM-2026-${String(certCount + 1).padStart(5, '0')}`,
              userId: user.id, courseId: enrFresh.courseId, campusId: enrFresh.campusId,
              enrollmentId, verifyCode: `JTM-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
              title: `Sijil Penyiapan Kursus — ${enrFresh.course.title}`,
              recipientName: user.name, recipientIc: user.icNumber,
              score: percentage, grade, issuedAt: new Date(),
              status: 'valid', signature: 'Jabatan Tenaga Manusia (JTM)',
            },
          })
          await db.enrollment.update({ where: { id: enrollmentId }, data: { status: 'completed', completedAt: new Date() } })
          await db.notification.create({
            data: {
              userId: user.id, type: 'certificate',
              title: 'Sijil Digital Diterbitkan',
              message: `Tahniah! Sijil untuk "${enrFresh.course.title}" telah dijana. Boleh disahkan via QR.`,
              link: '/certificates',
            },
          })
          await db.user.update({ where: { id: user.id }, data: { points: { increment: 100 } } })
        }
      }
    }
  }

  return ok({ attempt })
}
