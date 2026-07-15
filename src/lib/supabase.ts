import { createClient } from '@supabase/supabase-js'

/**
 * Supabase server client — uses the PostgREST API over HTTPS.
 *
 * Why HTTPS REST (not direct Postgres)?
 *   - This sandbox (and Netlify serverless functions) cannot open raw TCP
 *     sockets to Postgres port 5432 — only HTTPS (443) egress is allowed.
 *   - Supabase's PostgREST endpoint (https://<project>.supabase.co/rest/v1)
 *     tunnels all DB reads/writes through HTTPS, which works everywhere.
 *
 * Auth: uses the project's publishable (anon) key. RLS is NOT enabled on our
 * tables (created via the SQL setup script), so the anon key can read/write
 * all rows. Multi-tenant scoping is enforced at the API layer (tenantScope)
 * — same pattern as before, just the data-access layer swapped.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
  global: { headers: { 'x-application-name': 'elearning-JTM' } },
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
