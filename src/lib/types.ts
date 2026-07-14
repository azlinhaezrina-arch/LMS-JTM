// Shared frontend types — mirror Prisma models with JSON fields parsed.

export type Role = 'super_admin' | 'admin_kampus' | 'pengajar' | 'pelajar' | 'auditor'

export interface Campus {
  id: string
  code: string
  name: string
  nameEn: string | null
  state: string
  region: string
  status: string
  metadata: Record<string, unknown>
}

export interface SessionUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  role: Role
  campusId: string | null
  campus: Campus | null
  phone: string | null
  icNumber: string | null
  employeeId: string | null
  preferredLang: 'ms' | 'en'
  points: number
  streak: number
  lastSignInAt: string | null
  status: string
}

export interface CourseCategory {
  id: string
  name: string
  nameEn: string | null
  slug: string
  icon: string | null
  color: string | null
}

export interface Course {
  id: string
  code: string
  title: string
  titleEn: string | null
  description: string
  categoryId: string | null
  category: CourseCategory | null
  campusId: string
  campus: Campus | null
  instructorId: string | null
  instructor: { id: string; name: string; avatarUrl: string | null } | null
  level: string
  format: string
  durationHours: number
  durationDays: number
  credits: number
  price: number
  currency: string
  quota: number
  enrolledCount: number
  rating: number
  ratingCount: number
  coverColor: string
  coverIcon: string
  tags: string[]
  status: string
  startDate: string | null
  endDate: string | null
  competencies?: Competency[]
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string | null
  order: number
  durationMin: number
  isLocked: boolean
  contents: Content[]
}

export interface Content {
  id: string
  moduleId: string
  title: string
  type: string
  url: string | null
  durationSec: number
  sizeKb: number
  description: string | null
  isDownloadable: boolean
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  course: Course
  campusId: string
  status: string
  progressPct: number
  enrolledAt: string
  completedAt: string | null
  finalScore: number | null
}

export interface ProgressItem {
  id: string
  contentId: string
  status: string
  timeSpentSec: number
  score: number | null
  completedAt: string | null
}

export interface Quiz {
  id: string
  courseId: string
  title: string
  description: string | null
  questionCount: number
  passMark: number
  timeLimitMin: number
  maxAttempts: number
  questions?: Question[]
}

export interface Question {
  id: string
  type: string
  text: string
  options: { id: string; text: string }[]
  marks: number
  order: number
}

export interface QuizAttempt {
  id: string
  quizId: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  submittedAt: string | null
}

export interface ForumThread {
  id: string
  courseId: string | null
  userId: string
  user: { id: string; name: string; role: Role; avatarUrl: string | null }
  title: string
  body: string
  tags: string[]
  views: number
  isPinned: boolean
  isResolved: boolean
  createdAt: string
  posts?: ForumPost[]
  postCount?: number
}

export interface ForumPost {
  id: string
  threadId: string
  userId: string
  user: { id: string; name: string; role: Role; avatarUrl: string | null }
  body: string
  likes: number
  isAnswer: boolean
  createdAt: string
}

export interface Certificate {
  id: string
  certNumber: string
  userId: string
  user: { id: string; name: string; avatarUrl: string | null }
  courseId: string
  course: { id: string; title: string; code: string }
  campusId: string
  campus: { id: string; name: string; code: string } | null
  verifyCode: string
  title: string
  recipientName: string
  recipientIc: string | null
  score: number
  grade: string
  issuedAt: string
  expiryAt: string | null
  status: string
  signature: string
}

export interface Badge {
  id: string
  code: string
  name: string
  nameEn: string | null
  description: string
  icon: string
  color: string
  criteria: Record<string, unknown>
  issuer: string
  earned?: boolean
  awardedAt?: string | null
}

export interface Competency {
  id: string
  code: string
  name: string
  nameEn: string | null
  framework: string
  level: number
  sector: string | null
  status?: string
  achievedAt?: string | null
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  campusCode: string | null
  campusName: string | null
  role: Role
  points: number
  streak: number
  coursesCompleted: number
  badges: number
}

export interface AnalyticsSummary {
  totals: {
    users: number
    courses: number
    enrollments: number
    certificates: number
    campuses: number
    completionRate: number
    avgScore: number
    activeLearners: number
  }
  enrollmentsTrend: { label: string; value: number }[]
  completionByCampus: { campus: string; code: string; rate: number; enrolled: number; completed: number }[]
  categoryDistribution: { name: string; value: number; color: string }[]
  statusBreakdown: { name: string; value: number; color: string }[]
  topCourses: { id: string; title: string; enrolled: number; rating: number }[]
  regionPerformance: { region: string; campuses: number; completion: number }[]
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  ts?: number
}
