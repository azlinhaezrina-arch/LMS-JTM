import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody, parseJson } from '@/lib/api'
import type { AIMessage } from '@/lib/types'

/**
 * AI Learning Assistant — LMS JTM
 * Powered by GLM via z-ai-web-dev-sdk.
 * Context-aware: knows the learner's role, campus, active courses & competencies.
 * Responds in Bahasa Malaysia by default (respects preferredLang).
 */
export async function POST(req: NextRequest) {
  const user = await requireUser()
  const { message, courseId, history = [] } = await parseBody<{
    message: string; courseId?: string; history?: AIMessage[]
  }>(req)

  if (!message?.trim()) return fail('Mesej diperlukan', 400)

  // Build context: user role, campus, active courses, competencies
  const [activeEnrollments, achievedComps] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id, status: { in: ['active', 'completed'] } },
      include: { course: { select: { title: true, code: true } } },
      take: 8,
    }),
    db.userCompetency.findMany({
      where: { userId: user.id, status: 'achieved' },
      include: { competency: { select: { code: true, name: true } } },
      take: 10,
    }),
  ])

  let courseContext = ''
  if (courseId) {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { contents: true } }, category: true },
    })
    if (course) {
      courseContext = `\n\nKonteks kursus semasa:\n- Tajuk: ${course.title} (${course.code})\n- Kategori: ${course.category?.name}\n- Modul: ${course.modules.map((m) => m.title).join(', ')}\n- Deskripsi: ${course.description}`
    }
  }

  const lang = user.preferredLang === 'en' ? 'English' : 'Bahasa Malaysia'
  const systemPrompt = `Anda adalah "Cikgu AI", pembantu pembelajaran maya untuk LMS JTM (Jabatan Tenaga Manusia Malaysia) — platform latihan TVET untuk 33 kampus ADTEC.

Identiti pengguna semasa:
- Nama: ${user.name}
- Peranan: ${user.role}
- Kampus: ${user.campus?.name ?? 'JTM HQ'} (${user.campus?.code ?? 'HQ'})
- Kursus aktif: ${activeEnrollments.map((e) => `${e.course.title} (${e.course.code}, ${e.progressPct}%)`).join('; ') || 'tiada'}
- Kompetensi SKM/NOSS dicapai: ${achievedComps.map((c) => c.competency.code).join(', ') || 'tiada lagi'}
${courseContext}

Tugas anda:
1. Jawab soalan pelajar tentang kandungan kursus, konsep teknikal (mekatronik, elektrik, IT, automotif, dll), dan proses LMS.
2. Berikan penjelasan yang jelas, ringkas dan praktikal dengan contoh.
3. Cadangkan modul atau sumber susulan yang berkaitan.
4. Jika soalan di luar skop pembelajaran, arahkan pelajar ke forum atau pengajar.
5. Jawab dalam ${lang} secara default, kecuali pengguna bertanya dalam bahasa lain.
6. Sertakan ringkasan "💡 Tip" di hujung jawapan jika berkaitan.

Gaya: mesra, profesional, menyokong. Gunakan format Markdown ringkas (tajuk ##, senarai -, **tebal**) untuk kebolehbacaan.`

  const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [
    { role: 'assistant', content: systemPrompt },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })
    const reply = completion.choices[0]?.message?.content ?? 'Maaf, saya tidak dapat menjana jawapan sekarang. Sila cuba lagi.'

    // Persist conversation (best-effort)
    try {
      const existing = await db.aIConversation.findFirst({
        where: { userId: user.id, courseId: courseId ?? null },
        orderBy: { updatedAt: 'desc' },
      })
      const newMessages = [
        ...(existing ? parseJson<AIMessage[]>(existing.messages, []) : []),
        { role: 'user', content: message, ts: Date.now() },
        { role: 'assistant', content: reply, ts: Date.now() },
      ].slice(-50)
      if (existing) {
        await db.aIConversation.update({
          where: { id: existing.id },
          data: { messages: JSON.stringify(newMessages), updatedAt: new Date() },
        })
      } else {
        await db.aIConversation.create({
          data: {
            userId: user.id,
            courseId: courseId ?? null,
            title: message.slice(0, 80),
            messages: JSON.stringify(newMessages),
          },
        })
      }
    } catch {
      // ignore persistence errors
    }

    // Award points for engagement
    await db.user.update({ where: { id: user.id }, data: { points: { increment: 3 } } })

    return ok({ reply, conversationId: courseId ?? 'general' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ralat AI'
    // Graceful fallback so the UI still works if AI service is unavailable
    const fallback = `Maaf, Cikgu AI sedang tidak dapat dihubungi buat masa ini (${msg}). 

Sementara itu, anda boleh:
- Menyemak modul kursus di bahagian **Pembelajaran Saya**
- Bertanya di **Forum** kepada pengajar dan rakan pelajar
- Menghubungi pentadbir kampus anda jika masalah berterusan.

💡 Tip: Pastikan anda log masuk menggunakan akaun yang sah dan cuba lagi sebentar lagi.`

    return ok({ reply: fallback, conversationId: courseId ?? 'general', degraded: true })
  }
}

// GET — fetch conversation history
export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  const conv = await db.aIConversation.findFirst({
    where: { userId: user.id, courseId: courseId ?? null },
    orderBy: { updatedAt: 'desc' },
  })
  return ok({
    messages: conv ? parseJson<AIMessage[]>(conv.messages, []) : [],
    conversationId: conv?.id ?? null,
  })
}
