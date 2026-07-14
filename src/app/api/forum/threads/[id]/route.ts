import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail, parseJson } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  const thread = await db.forumThread.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true, avatarUrl: true } },
      course: { select: { id: true, title: true, code: true } },
      posts: {
        include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!thread) return fail('Thread tidak dijumpai', 404)

  await db.forumThread.update({ where: { id }, data: { views: { increment: 1 } } })

  return ok({ thread: { ...thread, tags: parseJson(thread.tags, []) } })
}
