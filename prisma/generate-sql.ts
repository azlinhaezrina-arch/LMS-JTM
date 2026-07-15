/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generates supabase-setup.sql — a single file the user pastes into the
 * Supabase Dashboard → SQL Editor → Run. Contains:
 *   1. DROP + CREATE TABLE statements (22 tables, Postgres types, FKs, indexes)
 *   2. INSERT statements for all seed data (deterministic)
 *
 * Run: bun run prisma/generate-sql.ts
 */
import { writeFileSync } from 'fs'

// Deterministic pseudo-random (same as seed.ts)
let seedState = 1337
function rand() { seedState = (seedState * 1664525 + 1013904223) % 4294967296; return seedState / 4294967296 }
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)] }
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]; const out: T[] = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  return out
}
function int(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min }
// Global monotonic counter — guarantees unique IDs within a single SQL file run.
// (PostgreSQL evaluates sq(id()) ONCE per INSERT row in subquery-based inserts,
//  so Math.random() would assign the same id to multiple rows. The counter avoids this.)
let _idCounter = 0
function id() { _idCounter++; return 'seed_' + _idCounter.toString(36).padStart(8, '0') + '_' + seedState.toString(36) }
// SQL string escape
function sq(s: string | null | undefined): string {
  if (s === null || s === undefined) return 'NULL'
  return "'" + String(s).replace(/'/g, "''") + "'"
}
function sj(v: unknown): string { return sq(JSON.stringify(v)) } // JSON as string literal

// --- Same data tables as seed.ts ---
const CAMPUS_DATA: Array<[string, string, string, string, string]> = [
  ['JTM-HQ', 'Ibu Pejabat JTM', 'Wilayah Persekutuan Putrajaya', 'Tengah', '1992'],
  ['ADTEC-SA', 'ADTEC Shah Alam', 'Selangor', 'Tengah', '1998'],
  ['ADTEC-PG', 'ADTEC Pasir Gudang', 'Johor', 'Selatan', '1999'],
  ['ADTEC-KT', 'ADTEC Taiping', 'Perak', 'Utara', '2000'],
  ['ADTEC-KB', 'ADTEC Kemaman', 'Terengganu', 'Timur', '2001'],
  ['ADTEC-KCH', 'ADTEC Kuching', 'Sarawak', 'Sabah', '2002'],
  ['ADTEC-KK', 'ADTEC Kota Kinabalu', 'Sabah', 'Sabah', '2002'],
  ['ADTEC-BDR', 'ADTEC Bandar Penawar', 'Johor', 'Selatan', '2003'],
  ['ADTEC-MLK', 'ADTEC Melaka', 'Melaka', 'Selatan', '2004'],
  ['ADTEC-BTU', 'ADTEC Batu Pahat', 'Johor', 'Selatan', '2004'],
  ['ADTEC-SPR', 'ADTEC Sepang', 'Selangor', 'Tengah', '2005'],
  ['ADTEC-IPOH', 'ADTEC Ipoh', 'Perak', 'Utara', '2005'],
  ['ADTEC-PN', 'ADTEC Pulau Pinang', 'Pulau Pinang', 'Utara', '2006'],
  ['ADTEC-KLT', 'ADTEC Kulim', 'Kedah', 'Utara', '2006'],
  ['ADTEC-KTN', 'ADTEC Kota Bharu', 'Kelantan', 'Timur', '2007'],
  ['ADTEC-KUA', 'ADTEC Kuala Terengganu', 'Terengganu', 'Timur', '2007'],
  ['ADTEC-SBN', 'ADTEC Seremban', 'Negeri Sembilan', 'Tengah', '2008'],
  ['ADTEC-PKN', 'ADTEC Pekan', 'Pahang', 'Timur', '2008'],
  ['ADTEC-KTN2', 'ADTEC Kuantan', 'Pahang', 'Timur', '2009'],
  ['ADTEC-MR', 'ADTEC Maran', 'Pahang', 'Timur', '2009'],
  ['ADTEC-SRG', 'ADTEC Sungai Petani', 'Kedah', 'Utara', '2010'],
  ['ADTEC-AOR', 'ADTEC Alor Setar', 'Kedah', 'Utara', '2010'],
  ['ADTEC-KGR', 'ADTEC Kangar', 'Perlis', 'Utara', '2011'],
  ['ADTEC-TM', 'ADTEC Temerloh', 'Pahang', 'Timur', '2011'],
  ['ADTEC-SEG', 'ADTEC Segamat', 'Johor', 'Selatan', '2012'],
  ['ADTEC-MUR', 'ADTEC Muar', 'Johor', 'Selatan', '2012'],
  ['ADTEC-KLP', 'ADTEC Kuala Lipis', 'Pahang', 'Timur', '2013'],
  ['ADTEC-SBN2', 'ADTEC Sabak Bernam', 'Selangor', 'Tengah', '2013'],
  ['ADTEC-KLA', 'ADTEC Kuala Langat', 'Selangor', 'Tengah', '2014'],
  ['ADTEC-HPT', 'ADTEC Hulu Perak', 'Perak', 'Utara', '2014'],
  ['ADTEC-BNT', 'ADTEC Bintulu', 'Sarawak', 'Sabah', '2015'],
  ['ADTEC-TWN', 'ADTEC Tawau', 'Sabah', 'Sabah', '2015'],
  ['ADTEC-SB', 'ADTEC Sandakan', 'Sabah', 'Sabah', '2016'],
  ['ADTEC-LB', 'ADTEC Labuan', 'Wilayah Persekutuan Labuan', 'Sabah', '2016'],
]

const COURSE_CATEGORIES = [
  { name: 'Mekatronik', nameEn: 'Mechatronics', slug: 'mekatronik', icon: 'cog', color: 'emerald' },
  { name: 'Elektrik', nameEn: 'Electrical', slug: 'elektrik', icon: 'zap', color: 'amber' },
  { name: 'IT & Multimedia', nameEn: 'IT & Multimedia', slug: 'it-multimedia', icon: 'code', color: 'teal' },
  { name: 'Automotif', nameEn: 'Automotive', slug: 'automotif', icon: 'car', color: 'rose' },
  { name: 'Pembuatan', nameEn: 'Manufacturing', slug: 'pembuatan', icon: 'factory', color: 'violet' },
  { name: 'Elektronik', nameEn: 'Electronics', slug: 'elektronik', icon: 'cpu', color: 'emerald' },
  { name: 'Pemprosesan Makanan', nameEn: 'Food Processing', slug: 'makanan', icon: 'utensils', color: 'amber' },
  { name: 'Fesyen & Pakaian', nameEn: 'Fashion & Apparel', slug: 'fesyen', icon: 'shirt', color: 'rose' },
  { name: 'Awam & Binaan', nameEn: 'Civil & Construction', slug: 'binaan', icon: 'building', color: 'teal' },
  { name: 'Pengurusan', nameEn: 'Management', slug: 'pengurusan', icon: 'briefcase', color: 'violet' },
]

const COMPETENCIES = [
  { code: 'SKM-MEK-301', name: 'Memasang Dan Mencuba Sistem Mekatronik', framework: 'SKM', level: 3, sector: 'Mekatronik' },
  { code: 'SKM-MEK-302', name: 'Menyelenggara Sistem Automasi', framework: 'SKM', level: 3, sector: 'Mekatronik' },
  { code: 'SKM-ELE-301', name: 'Memasang Kabel Dan Wayar Elektrik', framework: 'SKM', level: 3, sector: 'Elektrik' },
  { code: 'SKM-ELE-302', name: 'Menyelenggara Pemasangan Elektrik', framework: 'SKM', level: 3, sector: 'Elektrik' },
  { code: 'SKM-IT-301', name: 'Membangunkan Aplikasi Web', framework: 'SKM', level: 3, sector: 'IT & Multimedia' },
  { code: 'SKM-IT-302', name: 'Mengurus Pangkalan Data', framework: 'SKM', level: 3, sector: 'IT & Multimedia' },
  { code: 'SKM-AUTO-301', name: 'Menyelenggara Enjin Kenderaan', framework: 'SKM', level: 3, sector: 'Automotif' },
  { code: 'NOSS-PBU-001', name: 'Operator Mesin CNC', framework: 'NOSS', level: 2, sector: 'Pembuatan' },
  { code: 'NOSS-ELEK-002', name: 'Teknikan Elektronik', framework: 'NOSS', level: 2, sector: 'Elektronik' },
  { code: 'SKM-PENG-401', name: 'Pengurusan Projek Latihan TVET', framework: 'SKM', level: 4, sector: 'Pengurusan' },
]

const COURSE_TEMPLATES = [
  { code: 'JTM-MEK-101', title: 'Asas Mekatronik & Automasi', catSlug: 'mekatronik', level: 'beginner', durationHours: 40, durationDays: 5, credits: 4, compCodes: ['SKM-MEK-301'] },
  { code: 'JTM-MEK-201', title: 'Sistem PLC Guna Lanjut', catSlug: 'mekatronik', level: 'intermediate', durationHours: 60, durationDays: 8, credits: 6, compCodes: ['SKM-MEK-301', 'SKM-MEK-302'] },
  { code: 'JTM-ELE-101', title: 'Pemasangan Elektrik Domestik', catSlug: 'elektrik', level: 'beginner', durationHours: 32, durationDays: 4, credits: 3, compCodes: ['SKM-ELE-301'] },
  { code: 'JTM-ELE-202', title: 'Penyelenggaraan Sistem Elektrik Industri', catSlug: 'elektrik', level: 'intermediate', durationHours: 48, durationDays: 6, credits: 5, compCodes: ['SKM-ELE-302'] },
  { code: 'JTM-IT-101', title: 'Pengaturcaraan Web Asas', catSlug: 'it-multimedia', level: 'beginner', durationHours: 40, durationDays: 5, credits: 4, compCodes: ['SKM-IT-301'] },
  { code: 'JTM-IT-202', title: 'Pangkalan Data & SQL Lanjut', catSlug: 'it-multimedia', level: 'intermediate', durationHours: 56, durationDays: 7, credits: 6, compCodes: ['SKM-IT-302'] },
  { code: 'JTM-IT-303', title: 'Keselamatan Siber & Ethical Hacking', catSlug: 'it-multimedia', level: 'advanced', durationHours: 64, durationDays: 8, credits: 7, compCodes: ['SKM-IT-302'] },
  { code: 'JTM-AUTO-101', title: 'Penyelenggaraan Enjin Kenderaan Moden', catSlug: 'automotif', level: 'beginner', durationHours: 36, durationDays: 5, credits: 4, compCodes: ['SKM-AUTO-301'] },
  { code: 'JTM-AUTO-202', title: 'Diagnostik Kereta Hibrid & EV', catSlug: 'automotif', level: 'advanced', durationHours: 72, durationDays: 9, credits: 8, compCodes: ['SKM-AUTO-301'] },
  { code: 'JTM-PBU-101', title: 'Pengendalian Mesin CNC', catSlug: 'pembuatan', level: 'intermediate', durationHours: 48, durationDays: 6, credits: 5, compCodes: ['NOSS-PBU-001'] },
  { code: 'JTM-ELEK-101', title: 'Pembaikan Litar Elektronik', catSlug: 'elektronik', level: 'beginner', durationHours: 32, durationDays: 4, credits: 3, compCodes: ['NOSS-ELEK-002'] },
  { code: 'JTM-MAK-101', title: 'Higine & Keselamatan Makanan', catSlug: 'makanan', level: 'beginner', durationHours: 24, durationDays: 3, credits: 2, compCodes: [] },
  { code: 'JTM-FES-101', title: 'Reka Bentuk Pakaian Digital', catSlug: 'fesyen', level: 'intermediate', durationHours: 40, durationDays: 5, credits: 4, compCodes: [] },
  { code: 'JTM-BNA-101', title: 'Pengurusan Tapak Bina', catSlug: 'binaan', level: 'intermediate', durationHours: 44, durationDays: 6, credits: 5, compCodes: [] },
  { code: 'JTM-PEG-101', title: 'Pengurusan Projek Latihan TVET', catSlug: 'pengurusan', level: 'advanced', durationHours: 36, durationDays: 5, credits: 4, compCodes: ['SKM-PENG-401'] },
  { code: 'JTM-PEG-201', title: 'Penilaian & Pentaksiran Kompetensi', catSlug: 'pengurusan', level: 'intermediate', durationHours: 30, durationDays: 4, credits: 3, compCodes: ['SKM-PENG-401'] },
]

const MODULE_TITLES = [
  'Pengenalan & Objektif Kursus', 'Konsep Asas & Terminologi', 'Alat & Keselamatan',
  'Komponen Utama Sistem', 'Prinsip Operasi', 'Amali Langkah Demi Langkah',
  'Penyelesaian Masalah Lazim', 'Kajian Kes Industri', 'Penilaian Praktikal', 'Penutup & Refleksi',
]
const CONTENT_TYPES = ['video', 'scorm', 'h5p', 'pdf', 'article'] as const

const BADGE_DEFS = [
  { code: 'BLZR-001', name: 'Pengguna Aktif', icon: 'flame', color: 'rose', criteria: { type: 'login_streak', threshold: 7 }, desc: 'Log masuk 7 hari berturut-turut' },
  { code: 'QUIZ-100', name: 'Kuiz Sempurna', icon: 'check-circle', color: 'emerald', criteria: { type: 'quiz_full_score', threshold: 1 }, desc: 'Skor penuh dalam satu kuiz' },
  { code: 'CPLT-001', name: 'Lulus Kursus Pertama', icon: 'graduation-cap', color: 'amber', criteria: { type: 'course_completed', threshold: 1 }, desc: 'Menyiapkan kursus pertama' },
  { code: 'CPLT-005', name: 'Pembelajar Gigih', icon: 'book-open', color: 'teal', criteria: { type: 'course_completed', threshold: 5 }, desc: 'Menyiapkan 5 kursus' },
  { code: 'FORUM-050', name: 'Penyumbang Forum', icon: 'message-square', color: 'violet', criteria: { type: 'forum_posts', threshold: 10 }, desc: '10 catatan forum' },
  { code: 'STREAK-30', name: 'Maraton 30 Hari', icon: 'trending-up', color: 'amber', criteria: { type: 'login_streak', threshold: 30 }, desc: '30 hari berturut-turut' },
  { code: 'HELP-010', name: 'Tangan Mentor', icon: 'hand-heart', color: 'rose', criteria: { type: 'answers_marked', threshold: 10 }, desc: 'Membantu 10 soalan rakan' },
  { code: 'CERT-001', name: 'Pegang Sijil Digital', icon: 'award', color: 'gold', criteria: { type: 'certificate_issued', threshold: 1 }, desc: 'Menerima sijil digital pertama' },
]

const FORUM_THREADS = [
  { title: 'Masalah sambungan PLC Mitsubishi FX — tidak boleh communicate dengan PC', body: 'Salam, saya cuba sambung PLC FX-3U ke GX Works2 tapi "cannot communicate". Kabel USB-SC09 baru beli. Ada sesiapa pernah alami masalah sama?' },
  { title: 'Tip belajar kod SQL dengan cepat', body: 'Kongsikan tip/website/youtube channel yang berkesan untuk belajar SQL dari zero. Saya perlukan untuk projek akhir.' },
  { title: 'Diagnostik enjin hybrid Toyota Aqua — bateri HV lemah?', body: 'Kerjaja Aqua 2014, fuel consumption tinggi tapi kuasa kurang. Code DTC P0A80. Adakah ini confirm bateri HV kena tukar?' },
  { title: 'Cara export rekod kompetensi SKM ke ePortfolio', body: 'Bagaimana saya boleh paparkan sijil SKM dan NOSS dalam ePortfolio supaya majikan boleh sahkan?' },
  { title: 'Selamat datang ke Forum elearning JTM!', body: 'Forum ini ruang perbincangan untuk seluruh komuniti TVET JTM — pelajar, pengajar dan pentadbir 33 kampus ADTEC. Sila beradab dan saling membantu.' },
  { title: 'Cadangan modul offline untuk kawasan internet terhad', body: 'Saya dari ADTEC Kuching. Capaian internet kadang-kadang terputus. Boleh tambah fungsi download modul untuk akses offline?' },
]

// === Helpers to format dates for SQL ===
const now = () => new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

// === Output buffer ===
const lines: string[] = []
const emit = (s: string) => lines.push(s)

// === Generate ===
async function main() {
  emit('-- ===========================================================================')
  emit('-- elearning JTM — Supabase Setup SQL')
  emit('-- ===========================================================================')
  emit('-- Run this entire script in: Supabase Dashboard → SQL Editor → New query → Run')
  emit('-- It creates all 22 tables + indexes and seeds them with dummy data.')
  emit('-- Idempotent: DROP IF EXISTS at the top makes it safe to re-run.')
  emit('-- ===========================================================================')
  emit('')
  emit('BEGIN;')
  emit('')

  // --- DDL ---
  emit('-- ===========================================================================')
  emit('-- 1. DROP EXISTING (idempotent)')
  emit('-- ===========================================================================')
  const dropOrder = [
    'AIConversation', 'AuditLog', 'Notification', 'UserCompetency', 'CourseCompetency',
    'Competency', 'UserBadge', 'Badge', 'Certificate', 'QuizAttempt', 'Question', 'Quiz',
    'Progress', 'Enrollment', 'Content', 'Module', 'ForumPost', 'ForumThread',
    'Course', 'CourseCategory', 'User', 'Campus',
  ]
  for (const t of dropOrder) emit(`DROP TABLE IF EXISTS "${t}" CASCADE;`)
  emit('')

  emit('-- ===========================================================================')
  emit('-- 2. CREATE TABLES')
  emit('-- ===========================================================================')

  emit(`CREATE TABLE "Campus" (
  id            TEXT PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  "nameEn"      TEXT,
  state         TEXT NOT NULL,
  region        TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  "establishedAt" TEXT,
  metadata      JSONB DEFAULT '{}',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "User" (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  "avatarUrl"     TEXT,
  role            TEXT NOT NULL DEFAULT 'pelajar',
  "campusId"      TEXT REFERENCES "Campus"(id) ON DELETE SET NULL,
  "ssoProvider"   TEXT NOT NULL DEFAULT 'mydigital_id',
  "ssoSubject"    TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  "lastSignInAt"  TIMESTAMPTZ,
  phone           TEXT,
  "icNumber"      TEXT,
  "employeeId"    TEXT,
  "preferredLang" TEXT NOT NULL DEFAULT 'ms',
  metadata        JSONB DEFAULT '{}',
  points          INT NOT NULL DEFAULT 0,
  streak          INT NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "CourseCategory" (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  "nameEn"    TEXT,
  slug        TEXT UNIQUE NOT NULL,
  icon        TEXT,
  color       TEXT,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Course" (
  id             TEXT PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  "titleEn"      TEXT,
  description    TEXT NOT NULL,
  "categoryId"   TEXT REFERENCES "CourseCategory"(id) ON DELETE SET NULL,
  "campusId"     TEXT NOT NULL REFERENCES "Campus"(id) ON DELETE RESTRICT,
  "instructorId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  level          TEXT NOT NULL DEFAULT 'beginner',
  format         TEXT NOT NULL DEFAULT 'blended',
  "durationHours" INT NOT NULL DEFAULT 0,
  "durationDays"  INT NOT NULL DEFAULT 0,
  credits        INT NOT NULL DEFAULT 0,
  price          DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'MYR',
  quota          INT NOT NULL DEFAULT 30,
  "enrolledCount" INT NOT NULL DEFAULT 0,
  rating         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount"  INT NOT NULL DEFAULT 0,
  "coverColor"   TEXT NOT NULL DEFAULT 'emerald',
  "coverIcon"    TEXT NOT NULL DEFAULT 'book-open',
  tags           JSONB DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'published',
  "startDate"    TEXT,
  "endDate"      TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Module" (
  id          TEXT PRIMARY KEY,
  "courseId"  TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  "order"     INT NOT NULL DEFAULT 0,
  "durationMin" INT NOT NULL DEFAULT 0,
  "isLocked"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Content" (
  id              TEXT PRIMARY KEY,
  "moduleId"      TEXT NOT NULL REFERENCES "Module"(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'video',
  url             TEXT,
  "durationSec"   INT NOT NULL DEFAULT 0,
  "sizeKb"        INT NOT NULL DEFAULT 0,
  description     TEXT,
  "isDownloadable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Enrollment" (
  id            TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "courseId"    TEXT NOT NULL REFERENCES "Course"(id) ON DELETE RESTRICT,
  "campusId"    TEXT NOT NULL REFERENCES "Campus"(id) ON DELETE RESTRICT,
  status        TEXT NOT NULL DEFAULT 'active',
  "progressPct" INT NOT NULL DEFAULT 0,
  "enrolledAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completedAt" TIMESTAMPTZ,
  "finalScore"  DOUBLE PRECISION,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Progress" (
  id              TEXT PRIMARY KEY,
  "enrollmentId"  TEXT NOT NULL REFERENCES "Enrollment"(id) ON DELETE CASCADE,
  "userId"        TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "contentId"     TEXT NOT NULL REFERENCES "Content"(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'not_started',
  "timeSpentSec"  INT NOT NULL DEFAULT 0,
  score           DOUBLE PRECISION,
  "completedAt"   TIMESTAMPTZ,
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("enrollmentId", "contentId")
);`)

  emit(`CREATE TABLE "Quiz" (
  id              TEXT PRIMARY KEY,
  "courseId"      TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  "moduleId"      TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  "questionCount" INT NOT NULL DEFAULT 0,
  "passMark"      DOUBLE PRECISION NOT NULL DEFAULT 60,
  "timeLimitMin"  INT NOT NULL DEFAULT 30,
  "maxAttempts"   INT NOT NULL DEFAULT 3,
  weight          DOUBLE PRECISION NOT NULL DEFAULT 1,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Question" (
  id              TEXT PRIMARY KEY,
  "quizId"        TEXT NOT NULL REFERENCES "Quiz"(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'mcq',
  text            TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',
  "correctAnswer" JSONB,
  explanation     TEXT,
  marks           DOUBLE PRECISION NOT NULL DEFAULT 1,
  "order"         INT NOT NULL DEFAULT 0
);`)

  emit(`CREATE TABLE "QuizAttempt" (
  id              TEXT PRIMARY KEY,
  "quizId"        TEXT NOT NULL REFERENCES "Quiz"(id) ON DELETE RESTRICT,
  "enrollmentId"  TEXT NOT NULL REFERENCES "Enrollment"(id) ON DELETE CASCADE,
  "userId"        TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  answers         JSONB NOT NULL DEFAULT '{}',
  score           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxScore"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  percentage      DOUBLE PRECISION NOT NULL DEFAULT 0,
  passed          BOOLEAN NOT NULL DEFAULT false,
  "startedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "submittedAt"   TIMESTAMPTZ
);`)

  emit(`CREATE TABLE "ForumThread" (
  id          TEXT PRIMARY KEY,
  "courseId"  TEXT REFERENCES "Course"(id) ON DELETE SET NULL,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  tags        JSONB DEFAULT '[]',
  views       INT NOT NULL DEFAULT 0,
  "isPinned"  BOOLEAN NOT NULL DEFAULT false,
  "isResolved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "ForumPost" (
  id          TEXT PRIMARY KEY,
  "threadId"  TEXT NOT NULL REFERENCES "ForumThread"(id) ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  likes       INT NOT NULL DEFAULT 0,
  "isAnswer"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Certificate" (
  id              TEXT PRIMARY KEY,
  "certNumber"    TEXT UNIQUE NOT NULL,
  "userId"        TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "courseId"      TEXT NOT NULL REFERENCES "Course"(id) ON DELETE RESTRICT,
  "campusId"      TEXT NOT NULL REFERENCES "Campus"(id) ON DELETE RESTRICT,
  "enrollmentId"  TEXT UNIQUE NOT NULL REFERENCES "Enrollment"(id) ON DELETE RESTRICT,
  "verifyCode"    TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientIc"   TEXT,
  score           DOUBLE PRECISION NOT NULL,
  grade           TEXT NOT NULL,
  "issuedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiryAt"      TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'valid',
  signature       TEXT NOT NULL DEFAULT 'Jabatan Tenaga Manusia (JTM)',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "Badge" (
  id          TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  "nameEn"    TEXT,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'award',
  color       TEXT NOT NULL DEFAULT 'amber',
  criteria    JSONB NOT NULL,
  issuer      TEXT NOT NULL DEFAULT 'Jabatan Tenaga Manusia',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "UserBadge" (
  id         TEXT PRIMARY KEY,
  "userId"   TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "badgeId"  TEXT NOT NULL REFERENCES "Badge"(id) ON DELETE RESTRICT,
  "awardedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence   JSONB,
  UNIQUE ("userId", "badgeId")
);`)

  emit(`CREATE TABLE "Competency" (
  id          TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  "nameEn"    TEXT,
  framework   TEXT NOT NULL DEFAULT 'SKM',
  level       INT NOT NULL DEFAULT 1,
  sector      TEXT,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "CourseCompetency" (
  id              TEXT PRIMARY KEY,
  "courseId"      TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  "competencyId"  TEXT NOT NULL REFERENCES "Competency"(id) ON DELETE CASCADE,
  weight          DOUBLE PRECISION NOT NULL DEFAULT 1,
  UNIQUE ("courseId", "competencyId")
);`)

  emit(`CREATE TABLE "UserCompetency" (
  id              TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "competencyId"  TEXT NOT NULL REFERENCES "Competency"(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'in_progress',
  "achievedAt"    TIMESTAMPTZ,
  evidence        JSONB,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("userId", "competencyId")
);`)

  emit(`CREATE TABLE "Notification" (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type      TEXT NOT NULL DEFAULT 'info',
  title     TEXT NOT NULL,
  message   TEXT NOT NULL,
  link      TEXT,
  read      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "AuditLog" (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "campusId" TEXT REFERENCES "Campus"(id) ON DELETE SET NULL,
  action    TEXT NOT NULL,
  entity    TEXT,
  "entityId" TEXT,
  details   JSONB DEFAULT '{}',
  ip        TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit(`CREATE TABLE "AIConversation" (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "courseId" TEXT,
  title     TEXT,
  messages  JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);`)

  emit('')
  emit('-- Indexes for common queries')
  for (const [tbl, cols] of [
    ['User', '"campusId"'], ['User', 'role'], ['Course', '"campusId"'], ['Course', '"categoryId"'],
    ['Course', 'status'], ['Enrollment', '"userId"'], ['Enrollment', '"courseId"'], ['Enrollment', '"campusId"'],
    ['Progress', '"enrollmentId"'], ['Progress', '"userId"'], ['Certificate', '"userId"'],
    ['ForumThread', '"courseId"'], ['ForumPost', '"threadId"'], ['Notification', '"userId"'],
    ['AuditLog', '"campusId"'], ['AIConversation', '"userId"'],
  ] as Array<[string, string]>) {
    emit(`CREATE INDEX "idx_${tbl}_${cols.replace(/"/g, '')}" ON "${tbl}" (${cols});`)
  }
  emit('')

  // --- SEED DATA ---
  emit('-- ===========================================================================')
  emit('-- 3. SEED DATA')
  emit('-- ===========================================================================')

  // Campuses
  const campusIds = new Map<string, string>()
  emit('-- Campuses (34)')
  for (const [code, name, state, region, est] of CAMPUS_DATA) {
    const cid = id(); campusIds.set(code, cid)
    emit(`INSERT INTO "Campus" (id, code, name, "nameEn", state, region, address, phone, email, status, "establishedAt", metadata, "createdAt", "updatedAt") VALUES (${sq(cid)}, ${sq(code)}, ${sq(name)}, ${sq(name.replace('ADTEC', 'ADTEC').replace('Ibu Pejabat', 'Headquarters'))}, ${sq(state)}, ${sq(region)}, ${sq(`${name}, ${state}, Malaysia`)}, ${sq('+60' + int(3, 9) + '-' + int(1000000, 9999999))}, ${sq(`info@${code.toLowerCase()}.jtm.gov.my`)}, 'active', ${sq(est)}, ${sj({ capacity: int(200, 600), workshops: int(8, 20), rating: parseFloat((3.8 + rand() * 1.2).toFixed(1)) })}, now(), now());`)
  }
  emit('')

  // Categories
  const catIds = new Map<string, string>()
  emit('-- Course Categories (10)')
  for (const cat of COURSE_CATEGORIES) {
    const cid = id(); catIds.set(cat.slug, cid)
    emit(`INSERT INTO "CourseCategory" (id, name, "nameEn", slug, icon, color, description, "createdAt") VALUES (${sq(cid)}, ${sq(cat.name)}, ${sq(cat.nameEn)}, ${sq(cat.slug)}, ${sq(cat.icon)}, ${sq(cat.color)}, ${sq(`Kategori kursus ${cat.name} di bawah JTM.`)}, now());`)
  }
  emit('')

  // Competencies
  const compIds = new Map<string, string>()
  emit('-- Competencies (10)')
  for (const comp of COMPETENCIES) {
    const cid = id(); compIds.set(comp.code, cid)
    emit(`INSERT INTO "Competency" (id, code, name, framework, level, sector, description, "createdAt") VALUES (${sq(cid)}, ${sq(comp.code)}, ${sq(comp.name)}, ${sq(comp.framework)}, ${comp.level}, ${sq(comp.sector)}, ${sq(`Standard kompetensi ${comp.code} (${comp.framework} Tahap ${comp.level}).`)}, now());`)
  }
  emit('')

  // Users
  type U = { id: string; name: string; email: string; role: string; campusCode: string | null; points: number }
  const users: U[] = []
  users.push({ id: id(), name: "Dato' Dr. Haji Ramli bin Yusoff", email: 'super.admin@jtm.gov.my', role: 'super_admin', campusCode: 'JTM-HQ', points: 0 })
  users.push({ id: id(), name: 'Puan Noraini binti Hassan', email: 'auditor.noraini@jtm.gov.my', role: 'auditor', campusCode: 'JTM-HQ', points: 120 })
  for (const [code] of CAMPUS_DATA) {
    if (code === 'JTM-HQ') continue
    users.push({ id: id(), name: `Pentadbir ${code}`, email: `admin.${code.toLowerCase()}@jtm.gov.my`, role: 'admin_kampus', campusCode: code, points: int(80, 400) })
  }
  const instructorNames = ['Puan Zarina binti Mohamed', 'Encik Hafiz bin Rahman', 'Dr. Siti Aishah binti Abdullah', 'Encik Tan Wei Ming', 'Puan Kavitha a/p Raju', 'Encik Ahmad Faizal bin Omar', 'Puan Lim Su Yin', 'Encik Mohd Khairul bin Anuar', 'Puan Nurul Huda binti Kasim', 'Encik Rajesh a/l Kumaran', 'Puan Faridah binti Yusof', 'Encik Wong Chee Keong']
  const adtecCodes = CAMPUS_DATA.map(([c]) => c).filter((c) => c !== 'JTM-HQ')
  instructorNames.forEach((name, i) => {
    users.push({ id: id(), name, email: `pengajar.${i + 1}@${adtecCodes[i % adtecCodes.length].toLowerCase()}.jtm.gov.my`, role: 'pengajar', campusCode: adtecCodes[i % adtecCodes.length], points: int(200, 900) })
  })
  const studentFirstNames = ['Amir', 'Aisyah', 'Daniel', 'Farah', 'Hakim', 'Nadia', 'Ariff', 'Zara', 'Iman', 'Luqman', 'Sofia', 'Aiman', 'Husna', 'Riyadh', 'Maryam', 'Zikri', 'Diana', 'Faiz', 'Hana', 'Iqbal', 'Jannah', 'Khairi', 'Laila', 'Mukhriz', 'Nabil', 'Putri', 'Qais', 'Rania', 'Sufian', 'Tania']
  const studentLastNames = ['bin Ali', 'binti Abu', 'bin Tan', 'binti Lee', 'bin Raju', 'binti Omar', 'bin Wong', 'binti Siva', 'bin Goh', 'binti Yap']
  const pinnedCampus = ['ADTEC-SA', 'ADTEC-SA', 'ADTEC-SA', 'ADTEC-PG', 'ADTEC-PG']
  for (let i = 0; i < 30; i++) {
    const campus = i < pinnedCampus.length ? pinnedCampus[i] : pick(adtecCodes)
    const fn = studentFirstNames[i]; const ln = pick(studentLastNames)
    users.push({ id: id(), name: `${fn} ${ln}`, email: `pelajar.${i + 1}@${campus.toLowerCase()}.jtm.gov.my`, role: 'pelajar', campusCode: campus, points: int(50, 1200) })
  }

  emit('-- Users (77)')
  for (const u of users) {
    const campusId = u.campusCode ? campusIds.get(u.campusCode)! : null
    emit(`INSERT INTO "User" (id, email, name, "avatarUrl", role, "campusId", "ssoProvider", "ssoSubject", status, "lastSignInAt", phone, "icNumber", "employeeId", "preferredLang", metadata, points, streak, "createdAt", "updatedAt") VALUES (${sq(u.id)}, ${sq(u.email)}, ${sq(u.name)}, NULL, ${sq(u.role)}, ${sq(campusId)}, 'mydigital_id', ${sq('mydid-' + u.id.slice(-8))}, 'active', ${sq(daysAgo(int(0, 14)))}, ${sq('+601' + int(2, 9) + '-' + int(1000000, 9999999))}, ${sq('0' + int(100000, 999999) + '-' + int(10, 99) + '-' + int(1000, 9999))}, ${u.role === 'pelajar' ? 'NULL' : sq(`JTM-${u.campusCode}-${int(1000, 9999)}`)}, ${rand() > 0.4 ? "'ms'" : "'en'"}, ${sj({ bio: '', skills: [] })}, ${u.points}, ${int(0, 28)}, now(), now());`)
  }
  emit('')

  const pelajarList = users.filter((u) => u.role === 'pelajar')
  const pengajarList = users.filter((u) => u.role === 'pengajar')

  // Courses
  const courseRecords: Array<{ id: string; code: string; instructorId: string | null; campusId: string; competencyCodes: string[]; title: string }> = []
  emit('-- Courses (instances)')
  for (const tpl of COURSE_TEMPLATES) {
    const instances = int(1, 2)
    const chosenCampuses = pickN(adtecCodes, Math.min(instances, adtecCodes.length))
    for (let k = 0; k < chosenCampuses.length; k++) {
      const campusCode = chosenCampuses[k]
      const campusId = campusIds.get(campusCode)!
      const instructor = pick(pengajarList.filter((p) => p.campusCode === campusCode)) || pick(pengajarList)
      const suffix = k > 0 ? `-${campusCode}` : ''
      const courseCode = `${tpl.code}${suffix}`
      const rating = parseFloat((3.8 + rand() * 1.3).toFixed(1))
      const ratingCount = int(8, 60)
      const enrolled = int(8, tpl.durationDays ? 28 : 20)
      const courseId = id()
      courseRecords.push({ id: courseId, code: courseCode, instructorId: instructor?.id ?? null, campusId, competencyCodes: tpl.compCodes, title: tpl.title })
      emit(`INSERT INTO "Course" (id, code, title, "titleEn", description, "categoryId", "campusId", "instructorId", level, format, "durationHours", "durationDays", credits, price, currency, quota, "enrolledCount", rating, "ratingCount", "coverColor", "coverIcon", tags, status, "startDate", "endDate", "createdAt", "updatedAt") VALUES (${sq(courseId)}, ${sq(courseCode)}, ${sq(tpl.title)}, ${sq(tpl.title)}, ${sq(`Kursus ${tpl.title} di bawah kategori ${tpl.catSlug}. Kursus ini direka bagi memenuhi keperluan kompetensi SKM/NOSS dan disampaikan secara ${pick(['online', 'blended', 'physical'])} di kampus ADTEC. Peserta akan mempelajari konsep asas sehingga amali lanjut melalui modul video, SCORM dan kuiz interaktif.`)}, ${sq(catIds.get(tpl.catSlug))}, ${sq(campusId)}, ${sq(instructor?.id ?? null)}, ${sq(tpl.level)}, ${sq(pick(['online', 'blended', 'physical']))}, ${tpl.durationHours}, ${tpl.durationDays}, ${tpl.credits}, ${pick([0, 0, 150, 250, 350, 500])}, 'MYR', 30, ${enrolled}, ${rating}, ${ratingCount}, ${sq(pick(['emerald', 'teal', 'amber', 'rose', 'violet']))}, ${sq(pick(['cog', 'zap', 'code', 'car', 'cpu', 'building', 'shirt', 'utensils', 'factory', 'briefcase']))}, ${sj([tpl.catSlug, tpl.level, 'SKM', 'TVET'])}, 'published', '2026-08-01', '2026-12-15', now(), now());`)

      // CourseCompetency
      for (const cc of tpl.compCodes) {
        emit(`INSERT INTO "CourseCompetency" (id, "courseId", "competencyId", weight) VALUES (${sq(id())}, ${sq(courseId)}, ${sq(compIds.get(cc))}, 1);`)
      }

      // Modules + content
      const moduleCount = int(4, 6)
      for (let m = 0; m < moduleCount; m++) {
        const modId = id()
        const modTitle = MODULE_TITLES[m] || `Modul ${m + 1}`
        const locked = m > 2 && rand() > 0.6
        emit(`INSERT INTO "Module" (id, "courseId", title, description, "order", "durationMin", "isLocked", "createdAt", "updatedAt") VALUES (${sq(modId)}, ${sq(courseId)}, ${sq(modTitle)}, ${sq(`Topik ${modTitle} bagi kursus ${tpl.title}.`)}, ${m + 1}, ${int(30, 120)}, ${locked ? 'TRUE' : 'FALSE'}, now(), now());`)
        const contentCount = int(2, 4)
        for (let ci = 0; ci < contentCount; ci++) {
          const type = pick(CONTENT_TYPES as unknown as string[])
          const dur = type === 'video' ? int(180, 1800) : type === 'scorm' ? int(600, 2400) : 0
          const sizekb = type === 'pdf' ? int(800, 5000) : type === 'video' ? int(50000, 250000) : int(2000, 20000)
          const downloadable = (type !== 'scorm' && type !== 'h5p')
          emit(`INSERT INTO "Content" (id, "moduleId", title, type, url, "durationSec", "sizeKb", description, "isDownloadable", "createdAt") VALUES (${sq(id())}, ${sq(modId)}, ${sq(`${modTitle} — Bahan ${ci + 1} (${type.toUpperCase()})`)}, ${sq(type)}, ${type === 'video' ? sq('https://stream.jtm.gov.my/v/' + id()) : type === 'pdf' ? sq('/content/sample.pdf') : 'NULL'}, ${dur}, ${sizekb}, ${sq(`Bahan pembelajaran format ${type} untuk modul ini.`)}, ${downloadable ? 'TRUE' : 'FALSE'}, now());`)
        }
      }

      // Quiz + questions
      const quizId = id()
      emit(`INSERT INTO "Quiz" (id, "courseId", "moduleId", title, description, "questionCount", "passMark", "timeLimitMin", "maxAttempts", weight, "createdAt") VALUES (${sq(quizId)}, ${sq(courseId)}, NULL, ${sq(`Kuiz Akhir — ${tpl.title}`)}, 'Penilaian kompetensi berdasarkan modul yang dipelajari.', 5, 60, 30, 3, 1, now());`)
      const sampleQuestions = [
        { type: 'mcq', text: 'Apakah fungsi utama sebuah PLC dalam sistem automasi?', opts: ['Memproses isyarat input dan mengawal output', 'Menyimpan data pelanggan', 'Menghantar emel automatik', 'Memainkan muzik latar'], correct: ['a'] },
        { type: 'mcq', text: 'Pilih kata kunci SQL yang betul untuk menapis rekod.', opts: ['FILTER', 'WHERE', 'SEARCH', 'MATCH'], correct: ['b'] },
        { type: 'true_false', text: 'Bateri HV pada kenderaan hibrid boleh dicas semula menggunakan bekalan kuasa biasa 240V.', opts: [], correct: 'true' },
        { type: 'mcq', text: 'Apakah langkah pertama dalam diagnostik kerosakan elektrik?', opts: ['Tukar komponen terus', 'Periksa bekalan kuasa & litar', 'Padam kod DTC', 'Restart sistem'], correct: ['b'] },
        { type: 'fill_blank', text: 'Singkatan CNC dalam pembuatan bermaksud Computer ___ Control.', opts: [], correct: 'Numerical' },
        { type: 'mcq', text: 'Standard kompetensi kebangsaan Malaysia dikenali sebagai?', opts: ['ISO 9001', 'SKM/NOSS', 'MQA', 'OSHA'], correct: ['b'] },
      ]
      const qs = pickN(sampleQuestions, 5)
      for (let qi = 0; qi < qs.length; qi++) {
        const q = qs[qi]
        emit(`INSERT INTO "Question" (id, "quizId", type, text, options, "correctAnswer", explanation, marks, "order") VALUES (${sq(id())}, ${sq(quizId)}, ${sq(q.type)}, ${sq(q.text)}, ${sj(q.opts.map((t, i) => ({ id: String.fromCharCode(97 + i), text: t })))}, ${sj(q.correct)}, 'Rujuk modul berkaitan untuk penjelasan terperinci.', 1, ${qi + 1});`)
      }
    }
  }
  emit('')

  // Enrollments + progress + certificates + quiz attempts
  let certCount = 0
  emit('-- Enrollments, Progress, Certificates, Quiz Attempts')
  for (const student of pelajarList) {
    const enrolledCourses = pickN(courseRecords, int(2, 4))
    for (const crs of enrolledCourses) {
      const progressPct = pick([0, 0, 15, 30, 45, 60, 75, 100, 100])
      const status: string = progressPct === 100 ? 'completed' : progressPct === 0 ? 'active' : pick(['active', 'active', 'active', 'dropped'])
      const enrolledAt = daysAgo(int(10, 90))
      const completedAt = status === 'completed' ? daysAgo(int(0, 10)) : null
      const finalScore = status === 'completed' ? pick([65, 72, 78, 81, 85, 88, 92, 95, 98]) : null
      const enrId = id()
      emit(`INSERT INTO "Enrollment" (id, "userId", "courseId", "campusId", status, "progressPct", "enrolledAt", "completedAt", "finalScore", "createdAt", "updatedAt") VALUES (${sq(enrId)}, ${sq(student.id)}, ${sq(crs.id)}, ${sq(student.campusCode ? campusIds.get(student.campusCode)! : null)}, ${sq(status)}, ${progressPct}, ${sq(enrolledAt)}, ${sq(completedAt)}, ${finalScore !== null ? finalScore : 'NULL'}, now(), now());`)

      // We can't easily reference content IDs here (they weren't stored). Insert progress against a few random content rows via subquery later is complex.
      // Simpler: skip granular progress rows in SQL (the app computes progressPct from count anyway; we already set progressPct above).
      // For realism, insert a few Progress rows by selecting random contents of this course.
      // IMPORTANT: use gen_random_uuid()::text and floor(random()*...) so Postgres
      // evaluates these PER ROW. Using sq(id()) here would evaluate once in JS and
      // assign the same id to all rows → duplicate key violation.
      emit(`INSERT INTO "Progress" (id, "enrollmentId", "userId", "contentId", status, "timeSpentSec", score, "completedAt", "updatedAt")
SELECT gen_random_uuid()::text, ${sq(enrId)}, ${sq(student.id)}, c.id,
  CASE WHEN ${progressPct} = 0 THEN 'not_started' WHEN random() < ${progressPct}/100.0 THEN 'completed' ELSE 'in_progress' END,
  floor(60 + random()*1740)::int,
  ${progressPct >= 30 ? 'floor(70 + random()*30)::int' : 'NULL'},
  CASE WHEN random() < ${progressPct}/100.0 THEN now() ELSE NULL END, now()
FROM "Content" c JOIN "Module" m ON c."moduleId" = m.id WHERE m."courseId" = ${sq(crs.id)} LIMIT 5;`)

      // Quiz attempt
      if (progressPct >= 30) {
        const pct = pick([55, 65, 72, 80, 88, 95])
        emit(`INSERT INTO "QuizAttempt" (id, "quizId", "enrollmentId", "userId", answers, score, "maxScore", percentage, passed, "startedAt", "submittedAt")
SELECT gen_random_uuid()::text, q.id, ${sq(enrId)}, ${sq(student.id)}, '{}'::jsonb, ${Math.round(pct / 100 * 5 * 10) / 10}, 5, ${pct}, ${pct >= 60 ? 'TRUE' : 'FALSE'}, now(), now()
FROM "Quiz" q WHERE q."courseId" = ${sq(crs.id)} LIMIT 1;`)
      }

      // Certificate for completed
      if (status === 'completed') {
        const score = finalScore ?? 75
        const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 75 ? 'A-' : score >= 70 ? 'B+' : score >= 65 ? 'B' : 'Lulus'
        certCount++
        const certNum = `JTM-2026-${String(certCount).padStart(5, '0')}`
        const verify = `JTM-${id().toUpperCase()}`
        emit(`INSERT INTO "Certificate" (id, "certNumber", "userId", "courseId", "campusId", "enrollmentId", "verifyCode", title, "recipientName", "recipientIc", score, grade, "issuedAt", status, signature, "createdAt") VALUES (${sq(id())}, ${sq(certNum)}, ${sq(student.id)}, ${sq(crs.id)}, ${sq(student.campusCode ? campusIds.get(student.campusCode)! : null)}, ${sq(enrId)}, ${sq(verify)}, ${sq(`Sijil Penyiapan Kursus — ${crs.title}`)}, ${sq(student.name)}, ${sq('0' + int(100000, 999999) + '-' + int(10, 99) + '-' + int(1000, 9999))}, ${score}, ${sq(grade)}, ${sq(completedAt!)}, 'valid', 'Jabatan Tenaga Manusia (JTM)', now());`)
      }
    }
  }
  emit('')

  // Badges + user badges
  const badgeIds = new Map<string, string>()
  emit('-- Badges (8)')
  for (const b of BADGE_DEFS) {
    const bid = id(); badgeIds.set(b.code, bid)
    emit(`INSERT INTO "Badge" (id, code, name, "nameEn", description, icon, color, criteria, issuer, "createdAt") VALUES (${sq(bid)}, ${sq(b.code)}, ${sq(b.name)}, ${sq(b.name)}, ${sq(b.desc)}, ${sq(b.icon)}, ${sq(b.color)}, ${sj(b.criteria)}, 'Jabatan Tenaga Manusia', now());`)
  }
  emit('-- User Badges')
  for (const student of pelajarList) {
    const earned = pickN(BADGE_DEFS, int(1, 4))
    for (const b of earned) {
      emit(`INSERT INTO "UserBadge" (id, "userId", "badgeId", "awardedAt", evidence) VALUES (${sq(id())}, ${sq(student.id)}, ${sq(badgeIds.get(b.code))}, ${sq(daysAgo(int(0, 40)))}, ${sj({ reason: b.desc })}) ON CONFLICT ("userId", "badgeId") DO NOTHING;`)
    }
  }
  emit('')

  // User competencies
  emit('-- User Competencies')
  for (const student of pelajarList) {
    const codes = pickN(COMPETENCIES, int(1, 3))
    for (const comp of codes) {
      const st = pick(['achieved', 'in_progress', 'in_progress', 'not_started'])
      emit(`INSERT INTO "UserCompetency" (id, "userId", "competencyId", status, "achievedAt", evidence, "createdAt", "updatedAt") VALUES (${sq(id())}, ${sq(student.id)}, ${sq(compIds.get(comp.code))}, ${sq(st)}, ${st === 'achieved' ? sq(daysAgo(int(5, 60))) : 'NULL'}, ${sj(st === 'achieved' ? { source: 'elearning JTM', courseId: pick(courseRecords).id } : {})}, now(), now()) ON CONFLICT ("userId", "competencyId") DO NOTHING;`)
    }
  }
  emit('')

  // Forum
  emit('-- Forum Threads + Posts')
  const fp = [...pelajarList, ...pengajarList]
  for (let i = 0; i < FORUM_THREADS.length; i++) {
    const t = FORUM_THREADS[i]
    const author = pick(fp)
    const courseId = i < 4 ? pick(courseRecords).id : null
    const threadId = id()
    emit(`INSERT INTO "ForumThread" (id, "courseId", "userId", title, body, tags, views, "isPinned", "isResolved", "createdAt", "updatedAt") VALUES (${sq(threadId)}, ${sq(courseId)}, ${sq(author.id)}, ${sq(t.title)}, ${sq(t.body)}, ${sj(pickN(['mekatronik', 'elektrik', 'it', 'automotif', 'umum', 'bantuan'], 2))}, ${int(20, 400)}, ${i === 4 ? 'TRUE' : 'FALSE'}, ${(i === 2 || i === 3) ? 'TRUE' : 'FALSE'}, now(), now());`)
    const replyCount = int(1, 5)
    const replies = [
      'Terima kasih atas perkongsian. Saya juga menghadapi masalah yang sama dan ini sangat membantu.',
      'Cuba semak kabel sambungan dan pastikan driver dipasang dengan betul.',
      'Saya cadangkan anda rujuk modul 3 dalam kursus berkenaan, ada penjelasan terperinci di situ.',
      'Mungkin boleh hubungi unit ICT kampus untuk bantuan teknikal lanjut.',
      'Boleh cuba reset PLC ke factory setting dahulu, kemudian configure semula.',
      'Bagus! Ini tepat seperti yang saya perlukan.',
    ]
    for (let r = 0; r < replyCount; r++) {
      const replier = pick(fp.filter((u) => u.id !== author.id))
      emit(`INSERT INTO "ForumPost" (id, "threadId", "userId", body, likes, "isAnswer", "createdAt", "updatedAt") VALUES (${sq(id())}, ${sq(threadId)}, ${sq(replier.id)}, ${sq(pick(replies))}, ${int(0, 15)}, ${(r === 0 && (i === 2 || i === 3)) ? 'TRUE' : 'FALSE'}, now(), now());`)
    }
  }
  emit('')

  // Notifications
  emit('-- Notifications')
  for (const u of users) {
    const n = int(1, 4)
    const templates = [
      { type: 'badge', title: 'Lencana Baharu!', msg: 'Anda telah dianugerahkan lencana baru. Semak di ePortfolio.' },
      { type: 'certificate', title: 'Sijil Digital Diterbitkan', msg: 'Sijil anda telah dijana. Boleh dimuat turun & disahkan via QR.' },
      { type: 'success', title: 'Kuiz Diluluskan', msg: 'Tahniah! Anda lulus kuiz dengan skor cemerlang.' },
      { type: 'info', title: 'Modul Baharu Diterbitkan', msg: 'Modul baru telah ditambah ke kursus anda.' },
      { type: 'warning', title: 'Tugasan Tertunda', msg: 'Anda ada tugasan yang belum diserah. Sila lengkapkan.' },
    ]
    for (let i = 0; i < n; i++) {
      const tmpl = pick(templates)
      emit(`INSERT INTO "Notification" (id, "userId", type, title, message, link, read, "createdAt") VALUES (${sq(id())}, ${sq(u.id)}, ${sq(tmpl.type)}, ${sq(tmpl.title)}, ${sq(tmpl.msg)}, ${sq(pick(['/dashboard', '/my-learning', '/certificates', '/forum', '/eportfolio']))}, ${rand() > 0.5 ? 'TRUE' : 'FALSE'}, now());`)
    }
  }
  emit('')

  // Audit logs
  emit('-- Audit Logs (40)')
  const actions = ['user.login', 'user.logout', 'course.publish', 'course.update', 'certificate.issue', 'enrollment.create', 'badge.award', 'admin.update_role', 'content.upload']
  for (let i = 0; i < 40; i++) {
    const u = pick(users)
    emit(`INSERT INTO "AuditLog" (id, "userId", "campusId", action, entity, "entityId", details, ip, "createdAt") VALUES (${sq(id())}, ${sq(u.id)}, ${sq(u.campusCode ? campusIds.get(u.campusCode)! : null)}, ${sq(pick(actions))}, ${sq(pick(['user', 'course', 'certificate', 'enrollment', 'badge']))}, ${sq(id())}, ${sj({ ip: '10.' + int(0, 255) + '.' + int(0, 255) + '.' + int(1, 254), userAgent: 'Mozilla/5.0' })}, ${sq('10.' + int(0, 255) + '.' + int(0, 255) + '.' + int(1, 254))}, now());`)
  }
  emit('')

  emit('COMMIT;')
  emit('')
  emit('-- ===========================================================================')
  emit('-- Done! All 22 tables created and seeded.')
  emit('-- Demo login emails (any password works via SSO simulation):')
  emit('--   super.admin@jtm.gov.my         (Super Admin JTM)')
  emit('--   auditor.noraini@jtm.gov.my     (Auditor)')
  emit('--   admin.adtec-sa@jtm.gov.my      (Admin Kampus)')
  emit('--   pengajar.1@adtec-sa.jtm.gov.my  (Pengajar)')
  emit('--   pelajar.1@adtec-sa.jtm.gov.my   (Pelajar)')
  emit('--   pelajar.4@adtec-pg.jtm.gov.my   (Pelajar ADTEC PG)')
  emit('-- ===========================================================================')

  writeFileSync('supabase-setup.sql', lines.join('\n'))
  console.log(`✅ Generated supabase-setup.sql (${lines.length} lines, ${Math.round(lines.join('\n').length / 1024)} KB)`)
  console.log(`   Tables: 22 | Campuses: ${CAMPUS_DATA.length} | Users: ${users.length} | Courses: ${courseRecords.length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
