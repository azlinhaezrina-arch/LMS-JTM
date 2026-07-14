import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { setSession } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const { email } = await parseBody<{ email?: string }>(req)
    if (!email) return fail('Email diperlukan', 400)

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { campus: true },
    })
    if (!user) return fail('Pengguna tidak dijumpai. Sila guna email demo yang sah.', 404)
    if (user.status !== 'active') return fail('Akaun anda telah digantung. Hubungi pentadbir.', 403)

    await setSession(user.id)
    await db.user.update({ where: { id: user.id }, data: { lastSignInAt: new Date() } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        campusId: user.campusId,
        action: 'user.login',
        entity: 'user',
        entityId: user.id,
        details: JSON.stringify({ method: 'mydigital_id_simulated' }),
        ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    })

    return ok({ user })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Ralat log masuk', 500)
  }
}
