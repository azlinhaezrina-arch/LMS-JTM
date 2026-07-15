import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase server client — uses the PostgREST API over HTTPS.
 *
 * Why HTTPS REST (not direct Postgres)?
 *   - Serverless platforms (Netlify Functions, Vercel Edge) and restricted
 *     sandboxes block raw TCP to Postgres port 5432 — only HTTPS (443) works.
 *   - Supabase's PostgREST endpoint tunnels all DB reads/writes through HTTPS.
 *
 * Auth: uses the project's publishable (anon) key. RLS is NOT enabled on our
 * tables (created via the SQL setup script), so the anon key can read/write
 * all rows. Multi-tenant scoping is enforced at the API layer (tenantScope).
 *
 * LAZY INIT: the client is created on first use, not at module load. This
 * prevents build-time crashes when env vars aren't set yet (Netlify sets
 * them at deploy time, not build time).
 */
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Set them in your .env file (local) or Netlify site settings (production).'
    )
  }
  _client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
    global: { headers: { 'x-application-name': 'elearning-JTM' } },
  })
  return _client
}

// Proxy so existing `supabase.from(...)` calls work unchanged.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Table name constants (kept in sync with supabase-setup.sql)
export const T = {
  Campus: 'Campus',
  User: 'User',
  CourseCategory: 'CourseCategory',
  Course: 'Course',
  Module: 'Module',
  Content: 'Content',
  Enrollment: 'Enrollment',
  Progress: 'Progress',
  Quiz: 'Quiz',
  Question: 'Question',
  QuizAttempt: 'QuizAttempt',
  ForumThread: 'ForumThread',
  ForumPost: 'ForumPost',
  Certificate: 'Certificate',
  Badge: 'Badge',
  UserBadge: 'UserBadge',
  Competency: 'Competency',
  CourseCompetency: 'CourseCompetency',
  UserCompetency: 'UserCompetency',
  Notification: 'Notification',
  AuditLog: 'AuditLog',
  AIConversation: 'AIConversation',
} as const
