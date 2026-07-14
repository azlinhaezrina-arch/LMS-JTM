/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * LMS JTM — Seed script
 * Populates the database with comprehensive dummy data:
 *   • 34 campuses (33 ADTEC + JTM HQ)
 *   • Users across all roles (super_admin, admin_kampus, pengajar, pelajar, auditor)
 *   • Course categories, courses, modules, content
 *   • Quizzes + questions, enrollments, progress
 *   • Certificates (QR-verifiable), badges, competencies (SKM/NOSS)
 *   • Forum threads/posts, notifications, audit logs, AI conversations
 *
 * Run: bun run db:seed
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Deterministic pseudo-random for reproducible seed
let seedState = 1337
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296
  return seedState / 4294967296
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)] }
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  }
  return out
}
function int(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min }
function id() { return 'seed_' + Math.random().toString(36).slice(2, 12) }

// ---------------------------------------------------------------------------
// 1. Campuses — 33 ADTEC + JTM HQ
// ---------------------------------------------------------------------------
const CAMPUS_DATA: Array<[string, string, string, string, string]> = [
  // code, name, state, region, established
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
  { title: 'Selamat datang ke Forum LMS JTM!', body: 'Forum ini ruang perbincangan untuk seluruh komuniti TVET JTM — pelajar, pengajar dan pentadbir 33 kampus ADTEC. Sila beradab dan saling membantu.' },
  { title: 'Cadangan modul offline untuk kawasan internet terhad', body: 'Saya dari ADTEC Kuching. Capaian internet kadang-kadang terputus. Boleh tambah fungsi download modul untuk akses offline?' },
]

async function main() {
  console.log('🌱 Seeding LMS JTM database...')

  // Clean
  await db.aIConversation.deleteMany()
  await db.auditLog.deleteMany()
  await db.notification.deleteMany()
  await db.userCompetency.deleteMany()
  await db.courseCompetency.deleteMany()
  await db.competency.deleteMany()
  await db.userBadge.deleteMany()
  await db.badge.deleteMany()
  await db.certificate.deleteMany()
  await db.quizAttempt.deleteMany()
  await db.question.deleteMany()
  await db.quiz.deleteMany()
  await db.progress.deleteMany()
  await db.enrollment.deleteMany()
  await db.content.deleteMany()
  await db.module.deleteMany()
  await db.forumPost.deleteMany()
  await db.forumThread.deleteMany()
  await db.course.deleteMany()
  await db.courseCategory.deleteMany()
  await db.user.deleteMany()
  await db.campus.deleteMany()
  console.log('  ✓ Cleared existing data')

  // ----- Campuses -----
  const campusMap = new Map<string, string>()
  for (const [code, name, state, region, est] of CAMPUS_DATA) {
    const c = await db.campus.create({
      data: {
        code, name, nameEn: name.replace('ADTEC', 'ADTEC').replace('Ibu Pejabat', 'Headquarters'),
        state, region, establishedAt: est,
        address: `${name}, ${state}, Malaysia`,
        email: `info@${code.toLowerCase()}.jtm.gov.my`,
        phone: '+60' + int(3, 9) + '-' + int(1000000, 9999999),
        metadata: JSON.stringify({ capacity: int(200, 600), workshops: int(8, 20), rating: (3.8 + rand() * 1.2).toFixed(1) }),
      },
    })
    campusMap.set(code, c.id)
  }
  console.log(`  ✓ Created ${campusMap.size} campuses`)

  // ----- Course Categories -----
  const catMap = new Map<string, string>()
  for (const cat of COURSE_CATEGORIES) {
    const c = await db.courseCategory.create({
      data: { name: cat.name, nameEn: cat.nameEn, slug: cat.slug, icon: cat.icon, color: cat.color, description: `Kategori kursus ${cat.name} di bawah JTM.` },
    })
    catMap.set(cat.slug, c.id)
  }

  // ----- Competencies -----
  const compMap = new Map<string, string>()
  for (const comp of COMPETENCIES) {
    const c = await db.competency.create({
      data: { code: comp.code, name: comp.name, framework: comp.framework, level: comp.level, sector: comp.sector, description: `Standard kompetensi ${comp.code} (${comp.framework} Tahap ${comp.level}).` },
    })
    compMap.set(comp.code, c.id)
  }
  console.log(`  ✓ Created ${catMap.size} categories, ${compMap.size} competencies`)

  // ----- Users -----
  type U = { id: string; name: string; email: string; role: string; campusCode: string | null; points: number }
  const users: U[] = []

  // Super admin (JTM HQ) — cross-tenant
  const sa: U = { id: id(), name: 'Dato\' Dr. Haji Ramli bin Yusoff', email: 'super.admin@jtm.gov.my', role: 'super_admin', campusCode: 'JTM-HQ', points: 0 }
  users.push(sa)
  // Auditor
  users.push({ id: id(), name: 'Puan Noraini binti Hassan', email: 'auditor.noraini@jtm.gov.my', role: 'auditor', campusCode: 'JTM-HQ', points: 120 })

  // Campus admins (one per ADTEC campus)
  for (const [code] of CAMPUS_DATA) {
    if (code === 'JTM-HQ') continue
    users.push({ id: id(), name: `Pentadbir ${code}`, email: `admin.${code.toLowerCase()}@jtm.gov.my`, role: 'admin_kampus', campusCode: code, points: int(80, 400) })
  }

  // Instructors (2-3 per category, distributed across campuses)
  const instructorNames = [
    'Puan Zarina binti Mohamed', 'Encik Hafiz bin Rahman', 'Dr. Siti Aishah binti Abdullah',
    'Encik Tan Wei Ming', 'Puan Kavitha a/p Raju', 'Encik Ahmad Faizal bin Omar',
    'Puan Lim Su Yin', 'Encik Mohd Khairul bin Anuar', 'Puan Nurul Huda binti Kasim',
    'Encik Rajesh a/l Kumaran', 'Puan Faridah binti Yusof', 'Encik Wong Chee Keong',
  ]
  const adtecCodes = CAMPUS_DATA.map(([c]) => c).filter(c => c !== 'JTM-HQ')
  instructorNames.forEach((name, i) => {
    users.push({ id: id(), name, email: `pengajar.${i + 1}@${adtecCodes[i % adtecCodes.length].toLowerCase()}.jtm.gov.my`, role: 'pengajar', campusCode: adtecCodes[i % adtecCodes.length], points: int(200, 900) })
  })

  // Students (30) — first few pinned to specific campuses for predictable demo logins
  const studentFirstNames = ['Amir', 'Aisyah', 'Daniel', 'Farah', 'Hakim', 'Nadia', 'Ariff', 'Zara', 'Iman', 'Luqman', 'Sofia', 'Aiman', 'Husna', 'Riyadh', 'Maryam', 'Zikri', 'Diana', 'Faiz', 'Hana', 'Iqbal', 'Jannah', 'Khairi', 'Laila', 'Mukhriz', 'Nabil', 'Putri', 'Qais', 'Rania', 'Sufian', 'Tania']
  const studentLastNames = ['bin Ali', 'binti Abu', 'bin Tan', 'binti Lee', 'bin Raju', 'binti Omar', 'bin Wong', 'binti Siva', 'bin Goh', 'binti Yap']
  const pinnedCampus = ['ADTEC-SA', 'ADTEC-SA', 'ADTEC-SA', 'ADTEC-PG', 'ADTEC-PG']
  for (let i = 0; i < 30; i++) {
    const campus = i < pinnedCampus.length ? pinnedCampus[i] : pick(adtecCodes)
    const fn = studentFirstNames[i]
    const ln = pick(studentLastNames)
    users.push({ id: id(), name: `${fn} ${ln}`, email: `pelajar.${i + 1}@${campus.toLowerCase()}.jtm.gov.my`, role: 'pelajar', campusCode: campus, points: int(50, 1200) })
  }

  const userRecords = []
  for (const u of users) {
    const rec = await db.user.create({
      data: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        campusId: u.campusCode ? campusMap.get(u.campusCode)! : null,
        ssoProvider: 'mydigital_id',
        ssoSubject: 'mydid-' + u.id.slice(-8),
        status: 'active',
        lastSignInAt: new Date(Date.now() - int(0, 14) * 86400000),
        phone: '+601' + int(2, 9) + '-' + int(1000000, 9999999),
        icNumber: '0' + int(100000, 999999) + '-' + int(10, 99) + '-' + int(1000, 9999),
        employeeId: u.role === 'pelajar' ? null : `JTM-${u.campusCode}-${int(1000, 9999)}`,
        preferredLang: rand() > 0.4 ? 'ms' : 'en',
        points: u.points,
        streak: int(0, 28),
        avatarUrl: null,
        metadata: JSON.stringify({ bio: '', skills: [] }),
      },
    })
    userRecords.push(rec)
  }
  console.log(`  ✓ Created ${userRecords.length} users (sa:${users.filter(u=>u.role==='super_admin').length} admin:${users.filter(u=>u.role==='admin_kampus').length} pengajar:${users.filter(u=>u.role==='pengajar').length} pelajar:${users.filter(u=>u.role==='pelajar').length} auditor:${users.filter(u=>u.role==='auditor').length})`)

  const pelajarList = userRecords.filter(u => u.role === 'pelajar')
  const pengajarList = userRecords.filter(u => u.role === 'pengajar')

  // ----- Courses -----
  let courseCount = 0
  const courseRecords: Array<{ id: string; code: string; instructorId: string | null; campusId: string; competencyCodes: string[]; title: string }> = []
  for (const tpl of COURSE_TEMPLATES) {
    // Each template → 1-2 instances across different campuses
    const instances = int(1, 2)
    const chosenCampuses = pickN(adtecCodes, Math.min(instances, adtecCodes.length))
    for (let k = 0; k < chosenCampuses.length; k++) {
      const campusCode = chosenCampuses[k]
      const campusId = campusMap.get(campusCode)!
      const instructor = pick(pengajarList.filter(p => p.campusId === campusId)) || pick(pengajarList)
      const suffix = k > 0 ? `-${campusCode}` : ''
      const courseCode = `${tpl.code}${suffix}`
      const rating = (3.8 + rand() * 1.3)
      const ratingCount = int(8, 60)
      const enrolled = int(8, tpl.durationDays ? 28 : 20)
      const c = await db.course.create({
        data: {
          code: courseCode,
          title: tpl.title,
          titleEn: tpl.title,
          description: `Kursus ${tpl.title} di bawah kategori ${tpl.catSlug}. Kursus ini direka bagi memenuhi keperluan kompetensi SKM/NOSS dan disampaikan secara ${pick(['online', 'blended', 'physical'])} di kampus ADTEC. Peserta akan mempelajari konsep asas sehingga amali lanjut melalui modul video, SCORM dan kuiz interaktif.`,
          categoryId: catMap.get(tpl.catSlug)!,
          campusId,
          instructorId: instructor?.id ?? null,
          level: tpl.level,
          format: pick(['online', 'blended', 'physical']),
          durationHours: tpl.durationHours,
          durationDays: tpl.durationDays,
          credits: tpl.credits,
          price: pick([0, 0, 150, 250, 350, 500]),
          currency: 'MYR',
          quota: 30,
          enrolledCount: enrolled,
          rating: parseFloat(rating.toFixed(1)),
          ratingCount,
          coverColor: pick(['emerald', 'teal', 'amber', 'rose', 'violet']),
          coverIcon: pick(['cog', 'zap', 'code', 'car', 'cpu', 'building', 'shirt', 'utensils', 'factory', 'briefcase']),
          tags: JSON.stringify([tpl.catSlug, tpl.level, 'SKM', 'TVET']),
          status: 'published',
          startDate: '2026-08-01',
          endDate: '2026-12-15',
        },
      })
      courseRecords.push({ id: c.id, code: courseCode, instructorId: instructor?.id ?? null, campusId, competencyCodes: tpl.compCodes, title: tpl.title })
      courseCount++

      // Link competencies
      for (const cc of tpl.compCodes) {
        await db.courseCompetency.create({ data: { courseId: c.id, competencyId: compMap.get(cc)!, weight: 1 } })
      }

      // Modules + content
      const moduleCount = int(4, 6)
      for (let m = 0; m < moduleCount; m++) {
        const mod = await db.module.create({
          data: {
            courseId: c.id,
            title: MODULE_TITLES[m] || `Modul ${m + 1}`,
            description: `Topik ${MODULE_TITLES[m] || m + 1} bagi kursus ${tpl.title}.`,
            order: m + 1,
            durationMin: int(30, 120),
            isLocked: m > 2 && rand() > 0.6,
          },
        })
        const contentCount = int(2, 4)
        for (let ci = 0; ci < contentCount; ci++) {
          const type = pick(CONTENT_TYPES as unknown as string[])
          await db.content.create({
            data: {
              moduleId: mod.id,
              title: `${mod.title} — Bahan ${ci + 1} (${type.toUpperCase()})`,
              type,
              url: type === 'video' ? 'https://stream.jtm.gov.my/v/' + id() : type === 'pdf' ? '/content/sample.pdf' : null,
              durationSec: type === 'video' ? int(180, 1800) : type === 'scorm' ? int(600, 2400) : 0,
              sizeKb: type === 'pdf' ? int(800, 5000) : type === 'video' ? int(50000, 250000) : int(2000, 20000),
              description: `Bahan pembelajaran format ${type} untuk modul ini.`,
              isDownloadable: type !== 'scorm' && type !== 'h5p',
            },
          })
        }
      }

      // Quiz
      const quiz = await db.quiz.create({
        data: {
          courseId: c.id,
          title: `Kuiz Akhir — ${tpl.title}`,
          description: 'Penilaian kompetensi berdasarkan modul yang dipelajari.',
          questionCount: 5,
          passMark: 60,
          timeLimitMin: 30,
          maxAttempts: 3,
          weight: 1,
        },
      })
      const sampleQuestions = [
        { type: 'mcq', text: 'Apakah fungsi utama sebuah PLC dalam sistem automasi?', opts: ['Memproses isyarat input dan mengawal output', 'Menyimpan data pelanggan', 'Menghantar emel automatik', 'Memainkan muzik latar'], correct: '["a"]' },
        { type: 'mcq', text: 'Pilih kata kunci SQL yang betul untuk menapis rekod.', opts: ['FILTER', 'WHERE', 'SEARCH', 'MATCH'], correct: '["b"]' },
        { type: 'true_false', text: 'Bateri HV pada kenderaan hibrid boleh dicas semula menggunakan bekalan kuasa biasa 240V.', opts: [], correct: '"true"' },
        { type: 'mcq', text: 'Apakah langkah pertama dalam diagnostik kerosakan elektrik?', opts: ['Tukar komponen terus', 'Periksa bekalan kuasa & litar', 'Padam kod DTC', 'Restart sistem'], correct: '["b"]' },
        { type: 'fill_blank', text: 'Singkatan CNC dalam pembuatan bermaksud Computer ___ Control.', opts: [], correct: '"Numerical"' },
        { type: 'mcq', text: 'Standard kompetensi kebangsaan Malaysia dikenali sebagai?', opts: ['ISO 9001', 'SKM/NOSS', 'MQA', 'OSHA'], correct: '["b"]' },
      ]
      const qs = pickN(sampleQuestions, 5)
      for (let qi = 0; qi < qs.length; qi++) {
        const q = qs[qi]
        await db.question.create({
          data: {
            quizId: quiz.id,
            type: q.type,
            text: q.text,
            options: JSON.stringify(q.opts.map((t, i) => ({ id: String.fromCharCode(97 + i), text: t }))),
            correctAnswer: q.correct,
            explanation: 'Rujuk modul berkaitan untuk penjelasan terperinci.',
            marks: 1,
            order: qi + 1,
          },
        })
      }
    }
  }
  console.log(`  ✓ Created ${courseCount} course instances with modules, content, quizzes`)

  // ----- Enrollments + Progress + Certificates -----
  let enrCount = 0, certCount = 0, progCount = 0
  for (const student of pelajarList) {
    const enrolledCourses = pickN(courseRecords, int(2, 4))
    for (const crs of enrolledCourses) {
      const progressPct = pick([0, 0, 15, 30, 45, 60, 75, 100, 100])
      const status: string = progressPct === 100 ? 'completed' : progressPct === 0 ? 'active' : pick(['active', 'active', 'active', 'dropped'])
      const enrolledAt = new Date(Date.now() - int(10, 90) * 86400000)
      const completedAt = status === 'completed' ? new Date(Date.now() - int(0, 10) * 86400000) : null
      const finalScore = status === 'completed' ? pick([65, 72, 78, 81, 85, 88, 92, 95, 98]) : null

      const enr = await db.enrollment.create({
        data: {
          userId: student.id,
          courseId: crs.id,
          campusId: student.campusId!,
          status,
          progressPct,
          enrolledAt,
          completedAt,
          finalScore: finalScore ?? null,
        },
      })
      enrCount++

      // Progress records for contents
      const contents = await db.content.findMany({ where: { module: { courseId: crs.id } }, take: 8 })
      for (const ct of contents) {
        const s = pick(['not_started', 'in_progress', 'completed', 'completed'])
        if (progressPct === 0 && s !== 'not_started') continue
        await db.progress.create({
          data: {
            enrollmentId: enr.id,
            userId: student.id,
            contentId: ct.id,
            status: s,
            timeSpentSec: s === 'not_started' ? 0 : int(60, 1800),
            score: s === 'completed' ? pick([70, 80, 90, 100]) : null,
            completedAt: s === 'completed' ? new Date(Date.now() - int(0, 20) * 86400000) : null,
          },
        })
        progCount++
      }

      // Quiz attempt
      if (progressPct >= 30) {
        const quiz = await db.quiz.findFirst({ where: { courseId: crs.id } })
        if (quiz) {
          const pct = pick([55, 65, 72, 80, 88, 95])
          const questions = await db.question.findMany({ where: { quizId: quiz.id } })
          await db.quizAttempt.create({
            data: {
              quizId: quiz.id,
              enrollmentId: enr.id,
              userId: student.id,
              answers: JSON.stringify(Object.fromEntries(questions.map((q, i) => [q.id, String.fromCharCode(97 + (i % 4))]))),
              score: Math.round(pct / 100 * questions.length * 10) / 10,
              maxScore: questions.length,
              percentage: pct,
              passed: pct >= quiz.passMark,
              submittedAt: new Date(Date.now() - int(0, 7) * 86400000),
            },
          })
        }
      }

      // Certificate for completed
      if (status === 'completed') {
        const score = finalScore ?? 75
        const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 75 ? 'A-' : score >= 70 ? 'B+' : score >= 65 ? 'B' : 'Lulus'
        const certNumber = `JTM-2026-${String(certCount + 1).padStart(5, '0')}`
        const verify = `JTM-${id().toUpperCase()}`
        await db.certificate.create({
          data: {
            certNumber,
            userId: student.id,
            courseId: crs.id,
            campusId: student.campusId!,
            enrollmentId: enr.id,
            verifyCode: verify,
            title: `Sijil Penyiapan Kursus — ${crs.title}`,
            recipientName: student.name,
            recipientIc: student.icNumber,
            score,
            grade,
            issuedAt: completedAt!,
            status: 'valid',
            signature: 'Jabatan Tenaga Manusia (JTM)',
          },
        })
        certCount++
      }
    }
  }
  console.log(`  ✓ Created ${enrCount} enrollments, ${progCount} progress records, ${certCount} certificates`)

  // ----- Competencies (user achievements) -----
  let compAch = 0
  for (const student of pelajarList) {
    const codes = pickN(COMPETENCIES, int(1, 3))
    for (const comp of codes) {
      const status = pick(['achieved', 'in_progress', 'in_progress', 'not_started'])
      await db.userCompetency.create({
        data: {
          userId: student.id,
          competencyId: compMap.get(comp.code)!,
          status,
          achievedAt: status === 'achieved' ? new Date(Date.now() - int(5, 60) * 86400000) : null,
          evidence: JSON.stringify(status === 'achieved' ? { source: 'LMS JTM', courseId: pick(courseRecords).id } : {}),
        },
      })
      compAch++
    }
  }

  // ----- Badges -----
  const badgeMap = new Map<string, string>()
  for (const b of BADGE_DEFS) {
    const rec = await db.badge.create({
      data: { code: b.code, name: b.name, nameEn: b.name, description: b.desc, icon: b.icon, color: b.color, criteria: JSON.stringify(b.criteria), issuer: 'Jabatan Tenaga Manusia' },
    })
    badgeMap.set(b.code, rec.id)
  }
  let badgeAwarded = 0
  for (const student of pelajarList) {
    const earned = pickN(BADGE_DEFS, int(1, 4))
    for (const b of earned) {
      await db.userBadge.create({
        data: {
          userId: student.id,
          badgeId: badgeMap.get(b.code)!,
          awardedAt: new Date(Date.now() - int(0, 40) * 86400000),
          evidence: JSON.stringify({ reason: b.desc }),
        },
      })
      badgeAwarded++
    }
  }
  console.log(`  ✓ Created ${badgeMap.size} badges, awarded ${badgeAwarded} times; ${compAch} competency records`)

  // ----- Forum -----
  const fp = [...pelajarList, ...pengajarList]
  for (let i = 0; i < FORUM_THREADS.length; i++) {
    const t = FORUM_THREADS[i]
    const author = pick(fp)
    const courseId = i < 4 ? pick(courseRecords).id : null
    const thread = await db.forumThread.create({
      data: {
        courseId,
        userId: author.id,
        title: t.title,
        body: t.body,
        tags: JSON.stringify(pickN(['mekatronik', 'elektrik', 'it', 'automotif', 'umum', 'bantuan'], 2)),
        views: int(20, 400),
        isPinned: i === 4,
        isResolved: i === 2 || i === 3,
      },
    })
    const replyCount = int(1, 5)
    for (let r = 0; r < replyCount; r++) {
      const replier = pick(fp.filter(u => u.id !== author.id))
      await db.forumPost.create({
        data: {
          threadId: thread.id,
          userId: replier.id,
          body: pick([
            'Terima kasih atas perkongsian. Saya juga menghadapi masalah yang sama dan ini sangat membantu.',
            'Cuba semak kabel sambungan dan pastikan driver dipasang dengan betul.',
            'Saya cadangkan anda rujuk modul 3 dalam kursus berkenaan, ada penjelasan terperinci di situ.',
            'Boleh cuba reset PLC ke factory setting dahulu, kemudian configure semula.',
            'Untuk SQL, saya sarankan praktis di SQLZoo atau W3Schools dulu sebelum buat projek sebenar.',
            'Bagus! Ini tepat seperti yang saya perlukan.',
            'Mungkin boleh hubungi unit ICT kampus untuk bantuan teknikal lanjut.',
          ]),
          likes: int(0, 15),
          isAnswer: r === 0 && thread.isResolved,
        },
      })
    }
  }
  console.log(`  ✓ Created ${FORUM_THREADS.length} forum threads with replies`)

  // ----- Notifications -----
  let notifCount = 0
  for (const u of userRecords) {
    const n = int(1, 4)
    for (let i = 0; i < n; i++) {
      const tmpl = pick([
        { type: 'badge', title: 'Lencana Baharu!', msg: 'Anda telah dianugerahkan lencana baru. Semak di ePortfolio.' },
        { type: 'certificate', title: 'Sijil Digital Diterbitkan', msg: 'Sijil anda telah dijana. Boleh dimuat turun & disahkan via QR.' },
        { type: 'success', title: 'Kuiz Diluluskan', msg: 'Tahniah! Anda lulus kuiz dengan skor cemerlang.' },
        { type: 'info', title: 'Modul Baharu Diterbitkan', msg: 'Modul baru telah ditambah ke kursus anda.' },
        { type: 'warning', title: 'Tugasan Tertunda', msg: 'Anda ada tugasan yang belum diserah. Sila lengkapkan.' },
      ])
      await db.notification.create({
        data: {
          userId: u.id,
          type: tmpl.type,
          title: tmpl.title,
          message: tmpl.msg,
          link: pick(['/dashboard', '/my-learning', '/certificates', '/forum', '/eportfolio']),
          read: rand() > 0.5,
        },
      })
      notifCount++
    }
  }

  // ----- Audit logs -----
  const actions = ['user.login', 'user.logout', 'course.publish', 'course.update', 'certificate.issue', 'enrollment.create', 'badge.award', 'admin.update_role', 'content.upload']
  for (let i = 0; i < 40; i++) {
    const u = pick(userRecords)
    await db.auditLog.create({
      data: {
        userId: u.id,
        campusId: u.campusId,
        action: pick(actions),
        entity: pick(['user', 'course', 'certificate', 'enrollment', 'badge']),
        entityId: id(),
        details: JSON.stringify({ ip: '10.' + int(0, 255) + '.' + int(0, 255) + '.' + int(1, 254), userAgent: 'Mozilla/5.0' }),
        ip: '10.' + int(0, 255) + '.' + int(0, 255) + '.' + int(1, 254),
      },
    })
  }
  console.log(`  ✓ Created ${notifCount} notifications, 40 audit logs`)

  console.log('\n✅ Seeding complete!')
  console.log(`   Campuses: ${campusMap.size}`)
  console.log(`   Users: ${userRecords.length}`)
  console.log(`   Courses: ${courseCount}`)
  console.log(`   Enrollments: ${enrCount}`)
  console.log(`   Certificates: ${certCount}`)
  console.log(`   Badges awarded: ${badgeAwarded}`)
  console.log('\n   Demo login (any of these emails, password irrelevant):')
  console.log('   • super.admin@jtm.gov.my        (Super Admin JTM)')
  console.log('   • auditor.noraini@jtm.gov.my    (Auditor)')
  console.log('   • admin.adtec-sa@jtm.gov.my     (Admin Kampus)')
  console.log('   • pengajar.1@adtec-sa.jtm.gov.my (Pengajar)')
  console.log('   • pelajar.1@adtec-sa.jtm.gov.my  (Pelajar)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
