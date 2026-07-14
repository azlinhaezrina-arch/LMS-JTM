import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, parseBody } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const notifs = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  const unread = await db.notification.count({ where: { userId: user.id, read: false } })
  return ok({ notifications: notifs, unread })
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser()
  const body = await parseBody<{ id?: string; all?: boolean }>(req)
  if (body.all) {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
  } else if (body.id) {
    await db.notification.updateMany({ where: { id: body.id, userId: user.id }, data: { read: true } })
  }
  return ok({ updated: true })
}
