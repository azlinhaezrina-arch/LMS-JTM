import { NextResponse } from 'next/server'
import { getCurrentUser } from './session'

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status })
}

export async function parseBody<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new Error('INVALID_JSON')
  }
}

/** Parse a Prisma JSON string field safely. */
export function parseJson<T = unknown>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

/** Wrap a route handler with auth + error handling. */
export function withUser<H extends (user: Awaited<ReturnType<typeof getCurrentUser>> & {}) => Promise<Response>>(handler: H) {
  return async (...args: Parameters<H>) => {
    try {
      const user = await getCurrentUser()
      // @ts-expect-error spread args
      return await handler(user, ...args)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Internal error'
      const status = msg === 'UNAUTHORIZED' ? 401 : msg === 'FORBIDDEN' ? 403 : 500
      return fail(msg, status)
    }
  }
}
