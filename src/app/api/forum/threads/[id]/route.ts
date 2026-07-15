import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const { data: thread, error } = await supabase
    .from(T.ForumThread)
    .select('*, user:User(id,name,role,"avatarUrl"), course:Course(id,title,code), posts:ForumPost(*, user:User(id,name,role,"avatarUrl"))')
    .eq('id', id)
    .single()
  if (error || !thread) return fail('Thread tidak dijumpai', 404)

  // Increment views
  await supabase.from(T.ForumThread).update({ views: (thread.views || 0) + 1 }).eq('id', id)

  // Sort posts oldest-first
  thread.posts = (thread.posts || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return ok({ thread: { ...thread, tags: thread.tags || [] } })
}
