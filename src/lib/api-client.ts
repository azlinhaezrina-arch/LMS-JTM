import type { SessionUser, Course, Enrollment, AnalyticsSummary, LeaderboardEntry, Certificate, Badge, Competency, Notification, ForumThread, ForumPost, AIMessage } from './types'

const base = '/api'

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    ...opts,
  })
  const text = await res.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { /* not json */ }
  if (!res.ok) {
    const msg = json?.error || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json?.data as T
}

export const api = {
  // Auth
  login: (email: string) => request<{ user: SessionUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
  logout: () => request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: SessionUser | null }>('/auth/me'),

  // Campuses
  campuses: () => request<{ campuses: any[] }>('/campuses'),

  // Courses
  courses: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ courses: Course[] }>(`/courses${qs}`)
  },
  course: (id: string) => request<{ course: Course & { modules: any[]; quizzes: any[]; myEnrollment: any } }>(`/courses/${id}`),
  enroll: (id: string) => request<{ enrollment: any }>(`/courses/${id}/enroll`, { method: 'POST' }),

  // Enrolments
  enrolments: (status?: string) => request<{ enrollments: Enrollment[] }>(`/enrolments${status ? `?status=${status}` : ''}`),
  enrolment: (id: string) => request<{ enrollment: any }>(`/enrolments/${id}`),

  // Progress
  updateProgress: (data: { enrollmentId: string; contentId: string; status: string; timeSpentSec?: number; score?: number }) =>
    request<{ progress: any }>('/progress', { method: 'POST', body: JSON.stringify(data) }),

  // Quiz
  quiz: (id: string) => request<{ quiz: any }>(`/quiz/${id}`),
  submitQuiz: (id: string, data: { enrollmentId: string; answers: Record<string, unknown> }) =>
    request<{ attempt: any }>(`/quiz/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),

  // Forum
  threads: (courseId?: string) => request<{ threads: ForumThread[] }>(`/forum/threads${courseId ? `?courseId=${courseId}` : ''}`),
  thread: (id: string) => request<{ thread: ForumThread & { posts: ForumPost[] } }>(`/forum/threads/${id}`),
  createThread: (data: { title: string; body: string; courseId?: string; tags?: string[] }) =>
    request<{ thread: ForumThread }>('/forum/threads', { method: 'POST', body: JSON.stringify(data) }),
  createPost: (threadId: string, data: { body: string; isAnswer?: boolean }) =>
    request<{ post: ForumPost }>(`/forum/threads/${threadId}/posts`, { method: 'POST', body: JSON.stringify(data) }),

  // Certificates
  certificates: () => request<{ certificates: Certificate[] }>('/certificates'),
  certificate: (id: string) => request<{ certificate: Certificate }>(`/certificates/${id}`),
  verifyCert: (code: string) => request<{ certificate: any }>(`/certificates/verify/${code}`),

  // Badges & Portfolio
  badges: () => request<{ badges: Badge[] }>('/badges'),
  portfolio: (userId: string) => request<{ portfolio: any }>(`/portfolio/${userId}`),

  // Analytics
  analytics: () => request<{ analytics: AnalyticsSummary }>('/analytics'),
  campusAnalytics: () => request<{ campuses: any[] }>('/analytics/campuses'),

  // Competencies
  competencies: () => request<{ competencies: Competency[] }>('/competencies'),

  // Leaderboard
  leaderboard: (scope?: string) => request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard${scope ? `?scope=${scope}` : ''}`),

  // Notifications
  notifications: () => request<{ notifications: Notification[]; unread: number }>('/notifications'),
  markRead: (id?: string, all?: boolean) =>
    request<{ updated: boolean }>('/notifications', { method: 'PATCH', body: JSON.stringify({ id, all }) }),

  // Admin
  adminUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ users: any[] }>(`/admin/users${qs}`)
  },
  auditLogs: (action?: string) => request<{ logs: any[] }>(`/admin/audit${action ? `?action=${action}` : ''}`),

  // AI Assistant
  aiChat: (data: { message: string; courseId?: string; history?: AIMessage[] }) =>
    request<{ reply: string; conversationId: string; degraded?: boolean }>('/ai-assistant', { method: 'POST', body: JSON.stringify(data) }),
  aiHistory: (courseId?: string) => request<{ messages: AIMessage[]; conversationId: string | null }>(`/ai-assistant${courseId ? `?courseId=${courseId}` : ''}`),
}
