# elearning JTM 🎓

**Sistem Pengurusan Pembelajaran** — platform pembelajaran digital bersepadu untuk **33 kampus ADTEC** di bawah **Jabatan Tenaga Manusia (JTM) Malaysia**. Dibangunkan berdasarkan PRD LMS JTM v1.0, menggunakan model GLM 5.2 (Z.ai) untuk pembantu pembelajaran maya.

> National digital learning platform for TVET under the Department of Manpower Malaysia — connecting 33 ADTEC campuses under one multi-tenant LMS with QR-verifiable digital certificates, SKM/NOSS competency tracking, and an AI tutor.

---

## ✨ Features

All 18 functional requirements from the PRD are implemented:

| # | Feature | Status |
|---|---------|--------|
| FR-01 | Single Sign-On (SSO — MyDigital ID simulated) | ✅ |
| FR-02 | Role-based dashboards (Pelajar, Pengajar, Admin Kampus, Super Admin, Auditor) | ✅ |
| FR-03 | Course management (multi-campus, categories, scheduling) | ✅ |
| FR-04 | Digital content (SCORM, H5P, Articulate, Video, PDF) | ✅ |
| FR-05 | Quizzes & assessment (MCQ, true/false, fill-blank, essay) | ✅ |
| FR-06 | Real-time progress tracking (xAPI-style learning records) | ✅ |
| FR-07 | Forum & communication (threads, replies, notifications) | ✅ |
| FR-08 | Analytics & reporting across 33 campuses | ✅ |
| FR-09 | Digital certificates with QR verification | ✅ |
| FR-10 | Role-Based Access Control (RBAC) + audit logs | ✅ |
| FR-11 | AI Learning Assistant (Cikgu AI — GLM 5.2) | ✅ |
| FR-12 | ePortfolio (shareable, public) | ✅ |
| FR-13 | Digital badges (Open Badges standard) | ✅ |
| FR-14 | Competency tracking (SKM/NOSS framework) | ✅ |
| FR-15 | Mobile-responsive design | ✅ |
| FR-16 | REST API (28 endpoints) | ✅ |
| FR-17 | Multi-tenant architecture (33 campuses, RLS-style scoping) | ✅ |
| FR-18 | Gamification (points, leaderboard, streaks, badges) | ✅ |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn │
│  Glassmorphism UI · Bilingual (BM/EN) · Dark/Light themes   │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTPS (REST API routes)
┌───────────────────────────▼─────────────────────────────────┐
│  28 API routes (src/app/api/*)                              │
│  Session (httpOnly cookie SSO) · Multi-tenant scoping       │
└───────────┬───────────────────────────────┬─────────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐         ┌─────────────────────────┐
│  Supabase (PostgREST) │         │  Z.ai GLM 5.2           │
│  PostgreSQL 15        │         │  (z-ai-web-dev-sdk)     │
│  22 tables · JSONB    │         │  AI Learning Assistant  │
└───────────────────────┘         └─────────────────────────┘
```

**Why Supabase over HTTPS (not direct Postgres)?**
Serverless platforms (Netlify Functions, Vercel Edge) and restricted sandboxes block raw TCP to Postgres port 5432. Supabase's PostgREST API tunnels all DB reads/writes through HTTPS — works everywhere, no connection pooling headaches.

---

## 🎨 Design

- **Glassmorphism UI** — animated aurora gradient background, frosted glass surfaces with `backdrop-blur`, gradient borders, glow accents
- **Color palette** — emerald/teal (growth) + amber/gold (achievement) + rose (alerts). No blue/indigo.
- **Fully responsive** — mobile-first design with collapsible sidebar
- **Bilingual** — Bahasa Malaysia / English toggle
- **Dark/Light themes** — with system detection

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ / Bun
- A Supabase project (free tier works)

### 1. Clone & install
```bash
git clone https://github.com/azlinhaezrina-arch/LMS-JTM.git
cd LMS-JTM
bun install   # or npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase URL + publishable key
```

### 3. Set up the database
1. Open your **Supabase Dashboard → SQL Editor → New query**
2. Open `supabase-setup.sql` from this repo, copy its entire contents
3. Paste into the SQL Editor → click **Run**

This creates all 22 tables + indexes and seeds them with dummy data (34 campuses, 77 users, 24 courses, 97 enrollments, 27 certificates, 65 badges...).

### 4. Run the dev server
```bash
bun run dev
```
Open http://localhost:3000

### 5. Log in with a demo account

| Email | Role |
|-------|------|
| `super.admin@jtm.gov.my` | Super Admin JTM (all 33 campuses) |
| `auditor.noraini@jtm.gov.my` | Auditor (governance) |
| `admin.adtec-sa@jtm.gov.my` | Campus Admin (ADTEC Shah Alam) |
| `pengajar.1@adtec-sa.jtm.gov.my` | Instructor / Trainer |
| `pelajar.1@adtec-sa.jtm.gov.my` | Student (ADTEC Shah Alam) |
| `pelajar.4@adtec-pg.jtm.gov.my` | Student (ADTEC Pasir Gudang) |

Any password works (SSO is simulated).

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma          # 22-model schema (PostgreSQL, for reference/migrations)
│   ├── seed.ts                # Seed script (for direct-DB dev)
│   └── generate-sql.ts        # Generates supabase-setup.sql
├── public/
│   └── logo-jtm.jpeg          # JTM official logo
├── src/
│   ├── app/
│   │   ├── api/               # 28 REST API routes (Supabase JS)
│   │   ├── layout.tsx         # Root layout + metadata
│   │   └── page.tsx           # Single user-visible route (client view router)
│   ├── components/
│   │   ├── lms/               # App shell, login, primitives, view router
│   │   ├── views/             # 15 views (Dashboard, Catalog, AI, etc.)
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── supabase.ts        # Supabase server client (HTTPS)
│       ├── session.ts         # SSO session + tenant scoping
│       ├── store.ts           # Zustand store (auth, view, i18n, theme)
│       ├── api-client.ts      # Typed fetch wrapper
│       ├── i18n.ts            # Bilingual strings
│       └── types.ts           # Shared TS types
├── supabase-setup.sql         # ← RUN THIS in Supabase SQL Editor
├── .env.example               # Environment template
└── next.config.ts
```

---

## 🗄️ Database Schema

22 tables modeled on Supabase architecture:
- **Multi-tenant root**: `Campus` (34 rows: 33 ADTEC + JTM HQ)
- **Auth analogue**: `User` (role, status, SSO metadata, campusId)
- **Catalog**: `CourseCategory`, `Course`, `Module`, `Content`
- **Learning records**: `Enrollment`, `Progress`, `Quiz`, `Question`, `QuizAttempt`
- **Community**: `ForumThread`, `ForumPost`
- **Achievement**: `Certificate` (QR-verifiable), `Badge`, `UserBadge`
- **Competency**: `Competency`, `CourseCompetency`, `UserCompetency` (SKM/NOSS)
- **Operations**: `Notification`, `AuditLog`, `AIConversation`

All tables use UUID-style `cuid` primary keys, `created_at`/`updated_at` timestamps, and native `JSONB` columns for flexible metadata. Multi-tenant row scoping is enforced at the API layer (`tenantScope()`).

---

## 🤖 AI Learning Assistant

"Cikgu AI" is powered by **GLM 5.2** via `z-ai-web-dev-sdk`. It's context-aware:
- Knows the learner's role, campus, active courses & SKM/NOSS competencies
- Responds in Bahasa Malaysia by default (respects `preferredLang`)
- Persists conversation history to Supabase
- Awards engagement points for each interaction

---

## ☁️ Deploy to Netlify

1. Push this repo to GitHub
2. Netlify → **Add new site → Import an existing project** → select this repo
3. Build settings:
   - **Build command**: `npm run build` (or `bun run build`)
   - **Publish directory**: `.next`
   - **Functions directory**: (leave default — Next.js handles this)
4. **Environment variables** (Site settings → Environment variables):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable key
5. **Deploy**

> **Note:** Run `supabase-setup.sql` in your Supabase SQL Editor *before* deploying, so the tables exist when the app goes live.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Supabase PostgreSQL 15 (PostgREST over HTTPS) |
| AI | Z.ai GLM 5.2 (`z-ai-web-dev-sdk`) |
| State | Zustand (client) |
| Charts | Recharts |
| Icons | Lucide React |
| Auth | Simulated SSO (httpOnly cookie, MyDigital ID analogue) |

---

## 📜 License

This project is developed for **Jabatan Tenaga Manusia (JTM) Malaysia** for internal use across the 33 ADTEC campus network.

---

## 🙏 Acknowledgements

- **PRD**: LMS JTM v1.0 (benchmarking CIAST LMS)
- **AI**: Z.ai GLM 5.2
- **DB**: Supabase (PostgreSQL)
- **UI**: shadcn/ui, Tailwind CSS

---

**Demo logins** (any password): `super.admin@jtm.gov.my` · `pelajar.1@adtec-sa.jtm.gov.my` · `pengajar.1@adtec-sa.jtm.gov.my`
