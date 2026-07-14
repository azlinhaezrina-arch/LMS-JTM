import { cookies } from 'next/headers'
import { db } from './db'
import type { User, Campus } from '@prisma/client'

/**
 * Simulated SSO session (MyDigital ID analogue).
 * Stores userId in an httpOnly cookie. On each request we hydrate the user
 * from the database — this mirrors Supabase's `auth.getUser()` pattern and
 * works on Netlify (stateless, serverless).
 */

const SESSION_COOKIE = 'jtm_lms_session'

export async function setSession(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export type SessionUser = User & { campus: Campus | null }

export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId()
  if (!id) return null
  const user = await db.user.findUnique({
    where: { id },
    include: { campus: true },
  })
  return user
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export type Role = 'super_admin' | 'admin_kampus' | 'pengajar' | 'pelajar' | 'auditor'

export function hasRole(user: SessionUser, ...roles: Role[]): boolean {
  return roles.includes(user.role as Role)
}

/**
 * Multi-tenant scope filter (Supabase RLS analogue).
 * - super_admin / auditor → see all campuses (no filter)
 * - other roles → scoped to their own campus
 */
export function tenantScope(user: SessionUser) {
  if (user.role === 'super_admin' || user.role === 'auditor') return {}
  return { campusId: user.campusId ?? '__none__' }
}
