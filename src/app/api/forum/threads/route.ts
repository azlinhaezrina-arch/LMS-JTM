import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, parseJson, parseBody } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100)

  const where: Record<string, unknown> = {}
  if (courseId) where.courseId = courseId

  const threads = await db.forumThread.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true, avatarUrl: true } },
      posts: { select: { id: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })

  return ok({
    threads: threads.map((t) => ({
      ...t,
      tags: parseJson(t.tags, []),
      postCount: t.posts.length,
      posts: undefined,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  const { title, body, courseId, tags } = await parseBody<{ title: string; body: string; courseId?: string; tags?: string[] }>(req)
  if (!title?.trim() || !body?.trim()) return ok({ error: 'Tajuk dan kandungan diperlukan' }, { status: 400 })

  const thread = await db.forumThread.create({
    data: {
      userId: user.id,
      courseId: courseId || null,
      title: title.trim(),
      body: body.trim(),
      tags: JSON.stringify(tags || []),
    },
    include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
  })

  await db.user.update({ where: { id: user.id }, data: { points: { increment: 10 } } })

  return ok({ thread: { ...thread, tags: tags || [], postCount: 0 } })
}
