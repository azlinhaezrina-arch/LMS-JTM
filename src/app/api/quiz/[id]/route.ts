import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail, parseJson } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: 'asc' } },
      attempts: { where: { userId: user.id }, orderBy: { submittedAt: 'desc' } },
    },
  })
  if (!quiz) return fail('Kuiz tidak dijumpai', 404)

  // Don't leak correct answers
  const safeQuestions = quiz.questions.map((q) => ({
    id: q.id, type: q.type, text: q.text, marks: q.marks, order: q.order,
    options: parseJson(q.options, []),
  }))

  return ok({
    quiz: {
      ...quiz,
      questions: safeQuestions,
      attempts: quiz.attempts.map((a) => ({
        id: a.id, score: a.score, maxScore: a.maxScore, percentage: a.percentage,
        passed: a.passed, submittedAt: a.submittedAt,
      })),
    },
  })
}
