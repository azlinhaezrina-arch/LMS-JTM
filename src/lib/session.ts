import { cookies } from 'next/headers'
import { supabase, T } from './supabase'
import type { SessionUser, Role, Campus } from './types'

/**
 * Simulated SSO session (MyDigital ID analogue).
 * Stores userId in an httpOnly cookie. On each request we hydrate the user
 * from Supabase (PostgREST over HTTPS) — works in serverless/sandboxed
 * environments where raw Postgres (port 5432) is blocked.
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

export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId()
  if (!id) return null
  const { data, error } = await supabase
    .from(T.User)
    .select('*, campus(*)')
    .eq('id', id)
    .single()
  if (error || !data) return null
  // Coerce to SessionUser shape (Supabase returns snake_case-matching column names; our cols are camelCase-quoted so it's fine)
  return data as unknown as SessionUser
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export function hasRole(user: SessionUser, ...roles: Role[]): boolean {
  return roles.includes(user.role as Role)
}

/**
 * Multi-tenant scope filter (Supabase RLS analogue).
 * - super_admin / auditor → see all campuses (no filter)
 * - other roles → scoped to their own campus
 */
export function tenantScope(user: SessionUser): Record<string, unknown> {
  if (user.role === 'super_admin' || user.role === 'auditor') return {}
  return { campusId: user.campusId ?? '__none__' }
}

/** Apply tenantScope to a Supabase query builder (filters on campusId). */
export function applyTenant<T>(
  query: { eq: (col: string, val: unknown) => T },
  user: SessionUser,
): T {
  if (user.role === 'super_admin' || user.role === 'auditor') return undefined as unknown as T
  return query.eq('campusId', user.campusId ?? '__none__')
}

export type { Campus }
