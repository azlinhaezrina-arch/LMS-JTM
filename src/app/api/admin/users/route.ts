import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (user.role !== 'super_admin' && user.role !== 'admin_kampus' && user.role !== 'auditor') {
    return fail('Akses ditolak', 403)
  }
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const search = searchParams.get('search')

  let query = supabase
    .from(T.User)
    .select('id, name, email, role, status, campusId, campus:Campus(*), points, streak, "lastSignInAt", "createdAt", "preferredLang"')
    .order('createdAt', { ascending: false })
    .limit(200)
  if (user.role !== 'super_admin' && user.role !== 'auditor') query = query.eq('campusId', user.campusId ?? '__none__')
  if (role) query = query.eq('role', role)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return ok({ users: [] })
  return ok({ users: data || [] })
}
