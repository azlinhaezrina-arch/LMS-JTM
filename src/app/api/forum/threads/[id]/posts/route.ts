import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const { body, isAnswer } = await parseBody<{ body: string; isAnswer?: boolean }>(req)
  if (!body?.trim()) return fail('Kandungan diperlukan', 400)

  const { data: thread, error: tErr } = await supabase
    .from(T.ForumThread)
    .select('id, userId, title')
    .eq('id', id)
    .single()
  if (tErr || !thread) return fail('Thread tidak dijumpai', 404)

  const postId = crypto.randomUUID()
  const { data: post, error } = await supabase
    .from(T.ForumPost)
    .insert({
      id: postId, threadId: id, userId: user.id,
      body: body.trim(), isAnswer: !!isAnswer,
    })
    .select('*, user:User(id,name,role,"avatarUrl")')
    .single()
  if (error) return fail('Gagal menambah balasan', 500)

  await supabase.from(T.User).update({ points: (user.points || 0) + 5 }).eq('id', user.id)

  if (isAnswer) {
    await supabase.from(T.ForumThread).update({ isResolved: true }).eq('id', id)
  }

  // Notify thread owner
  if (thread.userId !== user.id) {
    await supabase.from(T.Notification).insert({
      userId: thread.userId, type: 'info',
      title: 'Balasan Baharu di Forum',
      message: `${user.name} menjawab thread "${thread.title}"`,
      link: '/forum',
    })
  }

  return ok({ post })
}
