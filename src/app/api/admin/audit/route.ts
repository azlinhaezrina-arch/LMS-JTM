import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (user.role !== 'super_admin' && user.role !== 'auditor' && user.role !== 'admin_kampus') {
    return fail('Akses ditolak', 403)
  }
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

  let query = supabase
    .from(T.AuditLog)
    .select('*, user:User(id,name,role), campus:Campus(code,name)')
    .order('createdAt', { ascending: false })
    .limit(limit)
  if (user.role !== 'super_admin' && user.role !== 'auditor') query = query.eq('campusId', user.campusId ?? '__none__')
  if (action) query = query.eq('action', action)

  const { data, error } = await query
  if (error) return ok({ logs: [] })
  return ok({ logs: (data || []).map((l: any) => ({ ...l, details: l.details || {} })) })
}
