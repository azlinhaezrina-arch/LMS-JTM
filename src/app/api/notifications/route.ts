import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, parseBody } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const { data, error } = await supabase
    .from(T.Notification)
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })
    .limit(30)
  const { count: unread } = await supabase
    .from(T.Notification)
    .select('id', { count: 'exact', head: true })
    .eq('userId', user.id)
    .eq('read', false)
  if (error) return ok({ notifications: [], unread: 0 })
  return ok({ notifications: data || [], unread: unread || 0 })
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser()
  const body = await parseBody<{ id?: string; all?: boolean }>(req)
  if (body.all) {
    await supabase.from(T.Notification).update({ read: true }).eq('userId', user.id).eq('read', false)
  } else if (body.id) {
    await supabase.from(T.Notification).update({ read: true }).eq('id', body.id).eq('userId', user.id)
  }
  return ok({ updated: true })
}
