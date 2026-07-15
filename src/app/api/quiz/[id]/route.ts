import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  const { data: quiz, error } = await supabase
    .from(T.Quiz)
    .select('*, questions:Question(*), attempts:QuizAttempt(*)')
    .eq('id', id)
    .single()
  if (error || !quiz) return fail('Kuiz tidak dijumpai', 404)

  // Filter attempts to this user
  quiz.attempts = (quiz.attempts || []).filter((a: any) => a.userId === user.id)

  // Don't leak correct answers
  const safeQuestions = (quiz.questions || [])
    .sort((a: any, b: any) => a.order - b.order)
    .map((q: any) => ({
      id: q.id, type: q.type, text: q.text, marks: q.marks, order: q.order,
      options: q.options || [],
    }))

  return ok({
    quiz: {
      ...quiz,
      questions: safeQuestions,
      attempts: quiz.attempts.map((a: any) => ({
        id: a.id, score: a.score, maxScore: a.maxScore, percentage: a.percentage,
        passed: a.passed, submittedAt: a.submittedAt,
      })),
    },
  })
}
