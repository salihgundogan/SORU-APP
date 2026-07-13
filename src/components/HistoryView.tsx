import { useEffect, useMemo, useState } from 'react'
import type { Exam, Folder } from '../types'
import { listAttemptsWithExam, type AttemptRow } from '../lib/api'

interface Props {
  folders: Folder[]
  exams: Exam[]
}

interface Stats {
  total: number
  metinBildim: number
  nukteBildim: number
}

function pct(n: number, total: number): string {
  if (total === 0) return '—'
  return `%${Math.round((n / total) * 100)}`
}

export default function HistoryView({ folders, exams }: Props) {
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAttemptsWithExam()
      .then(setAttempts)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  const statsByExam = useMemo(() => {
    const map = new Map<string, Stats>()
    for (const a of attempts ?? []) {
      const examId = a.question?.exam_id
      if (!examId) continue
      const s = map.get(examId) ?? { total: 0, metinBildim: 0, nukteBildim: 0 }
      s.total += 1
      if (a.metin_sonuc === 'bildim') s.metinBildim += 1
      if (a.nukte_sonuc === 'bildim') s.nukteBildim += 1
      map.set(examId, s)
    }
    return map
  }, [attempts])

  if (error) {
    return (
      <div className="m-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
        Geçmiş yüklenemedi: {error}
      </div>
    )
  }

  if (attempts === null) {
    return <div className="p-6 text-stone-500">Yükleniyor…</div>
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up p-4 sm:p-6">
      <h2 className="mb-1 text-xl font-bold">Geçmiş</h2>
      <p className="mb-5 text-sm text-stone-500">
        Sınav ve klasör bazında toplam deneme sayısı ile metin/nükte başarı oranları.
      </p>

      {folders.map((folder) => {
        const folderExams = exams.filter((e) => e.folder_id === folder.id)
        const folderStats: Stats = folderExams.reduce(
          (acc, e) => {
            const s = statsByExam.get(e.id)
            if (s) {
              acc.total += s.total
              acc.metinBildim += s.metinBildim
              acc.nukteBildim += s.nukteBildim
            }
            return acc
          },
          { total: 0, metinBildim: 0, nukteBildim: 0 },
        )

        return (
          <div key={folder.id} className="mb-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-bold">📁 {folder.name}</h3>
              <div className="text-sm text-stone-600">
                {folderStats.total} deneme · Metin{' '}
                {pct(folderStats.metinBildim, folderStats.total)} · Nükte{' '}
                {pct(folderStats.nukteBildim, folderStats.total)}
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500">
                  <th className="py-1.5 font-medium">Sınav</th>
                  <th className="py-1.5 text-right font-medium">Deneme</th>
                  <th className="py-1.5 text-right font-medium">Metin başarı</th>
                  <th className="py-1.5 text-right font-medium">Nükte başarı</th>
                </tr>
              </thead>
              <tbody>
                {folderExams.map((exam) => {
                  const s = statsByExam.get(exam.id) ?? {
                    total: 0,
                    metinBildim: 0,
                    nukteBildim: 0,
                  }
                  return (
                    <tr key={exam.id} className="border-b border-stone-100">
                      <td className="py-1.5">{exam.name}</td>
                      <td className="py-1.5 text-right">{s.total}</td>
                      <td className="py-1.5 text-right">
                        {pct(s.metinBildim, s.total)}
                      </td>
                      <td className="py-1.5 text-right">
                        {pct(s.nukteBildim, s.total)}
                      </td>
                    </tr>
                  )
                })}
                {folderExams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-2 text-stone-400">
                      Bu klasörde sınav yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )
      })}

      {folders.length === 0 && (
        <p className="text-stone-400">Henüz klasör yok — önce soru ekle.</p>
      )}
    </div>
  )
}
