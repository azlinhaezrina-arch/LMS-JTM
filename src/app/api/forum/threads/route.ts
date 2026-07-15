import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, parseBody } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100)

  let query = supabase
    .from(T.ForumThread)
    .select('*, user:User(id,name,role,"avatarUrl"), posts:ForumPost(id)')
    .order('isPinned', { ascending: false })
    .order('createdAt', { ascending: false })
    .limit(limit)
  if (courseId) query = query.eq('courseId', courseId)

  const { data, error } = await query
  if (error) return ok({ threads: [] })

  const result = (data || []).map((t: any) => ({
    ...t,
    tags: t.tags || [],
    postCount: (t.posts || []).length,
    posts: undefined,
  }))

  return ok({ threads: result })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  const { title, body, courseId, tags } = await parseBody<{ title: string; body: string; courseId?: string; tags?: string[] }>(req)
  if (!title?.trim() || !body?.trim()) return ok({ error: 'Tajuk dan kandungan diperlukan' }, { status: 400 })

  const id = crypto.randomUUID()
  const { data: thread, error } = await supabase
    .from(T.ForumThread)
    .insert({
      id, userId: user.id, courseId: courseId || null,
      title: title.trim(), body: body.trim(),
      tags: tags || [],
    })
    .select('*, user:User(id,name,role,"avatarUrl")')
    .single()
  if (error) return ok({ error: error.message }, { status: 500 })

  await supabase.from(T.User).update({ points: (user.points || 0) + 10 }).eq('id', user.id)

  return ok({ thread: { ...thread, tags: tags || [], postCount: 0 } })
}
