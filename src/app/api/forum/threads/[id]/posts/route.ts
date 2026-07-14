import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const { body, isAnswer } = await parseBody<{ body: string; isAnswer?: boolean }>(req)
  if (!body?.trim()) return fail('Kandungan diperlukan', 400)

  const thread = await db.forumThread.findUnique({ where: { id } })
  if (!thread) return fail('Thread tidak dijumpai', 404)

  const post = await db.forumPost.create({
    data: {
      threadId: id, userId: user.id,
      body: body.trim(), isAnswer: !!isAnswer,
    },
    include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
  })

  await db.user.update({ where: { id: user.id }, data: { points: { increment: 5 } } })

  if (isAnswer) {
    await db.forumThread.update({ where: { id }, data: { isResolved: true } })
  }

  // Notify thread owner
  if (thread.userId !== user.id) {
    await db.notification.create({
      data: {
        userId: thread.userId, type: 'info',
        title: 'Balasan Baharu di Forum',
        message: `${user.name} menjawab thread "${thread.title}"`,
        link: '/forum',
      },
    })
  }

  return ok({ post })
}
