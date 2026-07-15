import { supabase, T } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET() {
  const user = await getCurrentUser()
  let query = supabase.from(T.Campus).select('*').order('region', { ascending: true }).order('name', { ascending: true })
  if (!user || (user.role !== 'super_admin' && user.role !== 'auditor')) {
    query = query.eq('status', 'active')
  }
  const { data, error } = await query
  if (error) return ok({ campuses: [] })
  return ok({ campuses: data || [] })
}
