import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { setSession } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const { email } = await parseBody<{ email?: string }>(req)
    if (!email) return fail('Email diperlukan', 400)

    const { data: user, error } = await supabase
      .from(T.User)
      .select('*, campus(*)')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !user) return fail('Pengguna tidak dijumpai. Sila guna email demo yang sah.', 404)
    if (user.status !== 'active') return fail('Akaun anda telah digantung. Hubungi pentadbir.', 403)

    await setSession(user.id)

    // Update lastSignInAt + audit log (fire-and-forget)
    await supabase.from(T.User).update({ lastSignInAt: new Date().toISOString() }).eq('id', user.id)
    await supabase.from(T.AuditLog).insert({
      userId: user.id,
      campusId: user.campusId,
      action: 'user.login',
      entity: 'user',
      entityId: user.id,
      details: { method: 'mydigital_id_simulated' },
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return ok({ user })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Ralat log masuk', 500)
  }
}
