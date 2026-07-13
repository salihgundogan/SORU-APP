import { useEffect, useState } from 'react'
import type { Exam, Question } from '../types'
import { deleteQuestion, listQuestionsByExam, updateQuestion } from '../lib/api'

interface Props {
  exam: Exam
  onStartExam: (exam: Exam) => void
}

export default function ExamDetail({ exam, onStartExam }: Props) {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [parcalar, setParcalar] = useState<string[]>([])
  const [nukte, setNukte] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setEditingId(null)
    setQuestions(null)
    listQuestionsByExam(exam.id)
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
  }, [exam.id])

  const startEdit = (q: Question) => {
    setEditingId(q.id)
    setParcalar([...q.parcalar])
    setNukte(q.nukte)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError(null)
  }

  const save = async (q: Question) => {
    const cleanParcalar = parcalar.map((p) => p.trim()).filter((p) => p !== '')
    if (cleanParcalar.length === 0) {
      setError('En az bir dolu parça gerekli.')
      return
    }
    if (!nukte.trim()) {
      setError('Nükte boş olamaz.')
      return
    }
    setBusy(true)
    try {
      const updated = await updateQuestion(q.id, cleanParcalar, nukte.trim())
      setQuestions((prev) =>
        prev ? prev.map((x) => (x.id === q.id ? updated : x)) : prev,
      )
      setEditingId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (q: Question) => {
    if (!confirm('Bu soru ve tüm deneme geçmişi silinecek. Emin misin?')) return
    setBusy(true)
    try {
      await deleteQuestion(q.id)
      setQuestions((prev) => (prev ? prev.filter((x) => x.id !== q.id) : prev))
      if (editingId === q.id) setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📄 {exam.name}</h2>
          <p className="text-sm text-slate-500">
            {questions === null ? 'Yükleniyor…' : `${questions.length} soru`} — düzenlemek
            için soruya tıkla.
          </p>
        </div>
        <button
          onClick={() => onStartExam(exam)}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
        >
          ▶ Testi Başlat
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {questions?.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">
          Bu sınavda henüz soru yok — "Soru Yönetimi" veya "Toplu Soru Ekle" ile
          ekleyebilirsin.
        </p>
      )}

      {questions?.map((q, qi) => {
        const isEditing = editingId === q.id
        return (
          <div
            key={q.id}
            className={`mb-3 rounded-2xl bg-white shadow-sm transition ${
              isEditing ? 'ring-2 ring-indigo-300' : ''
            }`}
          >
            {!isEditing ? (
              <button
                onClick={() => startEdit(q)}
                className="block w-full rounded-2xl p-4 text-left hover:bg-slate-50"
              >
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    Soru {qi + 1} · {q.parcalar.length} parça
                  </span>
                  <span className="text-xs text-indigo-500">Düzenle ✏️</span>
                </div>
                <p dir="rtl" className="mb-1 text-right font-arabic text-xl leading-relaxed">
                  {q.parcalar.join(' ')}
                </p>
                <p className="text-sm text-slate-500">💡 {q.nukte}</p>
              </button>
            ) : (
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-700">
                    Soru {qi + 1} düzenleniyor
                  </span>
                </div>

                <label className="mb-1 block text-sm text-slate-600">Parçalar</label>
                {parcalar.map((p, i) => (
                  <div key={i} className="mb-2 flex items-start gap-2">
                    <span className="mt-2 w-14 shrink-0 text-xs text-slate-500">
                      Parça {i + 1}
                    </span>
                    <textarea
                      dir="rtl"
                      value={p}
                      onChange={(e) =>
                        setParcalar(parcalar.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right font-arabic text-xl leading-relaxed"
                    />
                    <button
                      onClick={() => setParcalar(parcalar.filter((_, j) => j !== i))}
                      disabled={parcalar.length <= 1}
                      className="mt-1 rounded-md px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      title="Parçayı sil"
                    >
                      🗑
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setParcalar([...parcalar, ''])}
                  className="mb-3 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
                >
                  + Parça Ekle
                </button>

                <label className="mb-1 block text-sm text-slate-600">Nükte</label>
                <textarea
                  value={nukte}
                  onChange={(e) => setNukte(e.target.value)}
                  rows={2}
                  className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => void save(q)}
                    disabled={busy}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {busy ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={busy}
                    className="rounded-lg bg-slate-200 px-4 py-2 text-sm hover:bg-slate-300"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => void remove(q)}
                    disabled={busy}
                    className="ml-auto rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                  >
                    Soruyu Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
