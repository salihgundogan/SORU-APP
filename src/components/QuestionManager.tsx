import { useEffect, useState } from 'react'
import type { Exam, Folder, Question } from '../types'
import {
  createExam,
  createFolder,
  createQuestion,
  deleteQuestion,
  listQuestionsByExam,
  updateQuestion,
} from '../lib/api'

interface Props {
  folders: Folder[]
  exams: Exam[]
  onDataChanged: () => Promise<void>
}

const NEW = '__new__'

export default function QuestionManager({ folders, exams, onDataChanged }: Props) {
  const [folderId, setFolderId] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [examId, setExamId] = useState('')
  const [newExamName, setNewExamName] = useState('')

  const [parcalar, setParcalar] = useState<string[]>(['', ''])
  const [nukte, setNukte] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const folderExams = exams.filter((e) => e.folder_id === folderId)
  const realExamSelected = examId !== '' && examId !== NEW

  useEffect(() => {
    if (realExamSelected) {
      void listQuestionsByExam(examId).then(setQuestions)
    } else {
      setQuestions([])
    }
  }, [examId, realExamSelected])

  const resetForm = () => {
    setParcalar(['', ''])
    setNukte('')
    setEditingId(null)
  }

  const save = async () => {
    setMessage(null)
    const cleanParcalar = parcalar.map((p) => p.trim()).filter((p) => p !== '')
    if (cleanParcalar.length === 0) {
      setMessage('En az bir dolu parça gerekli.')
      return
    }
    if (!nukte.trim()) {
      setMessage('Nükte boş olamaz.')
      return
    }

    setBusy(true)
    try {
      let targetFolderId = folderId
      if (folderId === NEW) {
        if (!newFolderName.trim()) {
          setMessage('Yeni klasör adı gerekli.')
          return
        }
        const f = await createFolder(newFolderName.trim())
        targetFolderId = f.id
      }
      if (!targetFolderId) {
        setMessage('Klasör seç veya oluştur.')
        return
      }

      let targetExamId = examId
      if (examId === NEW || folderId === NEW) {
        if (!newExamName.trim()) {
          setMessage('Yeni sınav adı gerekli.')
          return
        }
        const e = await createExam(targetFolderId, newExamName.trim())
        targetExamId = e.id
      }
      if (!targetExamId) {
        setMessage('Sınav seç veya oluştur.')
        return
      }

      if (editingId) {
        await updateQuestion(editingId, cleanParcalar, nukte.trim())
        setMessage('Soru güncellendi.')
      } else {
        await createQuestion(targetExamId, cleanParcalar, nukte.trim())
        setMessage('Soru kaydedildi.')
      }

      await onDataChanged()
      setFolderId(targetFolderId)
      setExamId(targetExamId)
      setNewFolderName('')
      setNewExamName('')
      resetForm()
      setQuestions(await listQuestionsByExam(targetExamId))
    } catch (err) {
      setMessage(`Hata: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (q: Question) => {
    setEditingId(q.id)
    setParcalar([...q.parcalar])
    setNukte(q.nukte)
    window.scrollTo({ top: 0 })
  }

  const remove = async (q: Question) => {
    if (!confirm('Bu soru ve tüm deneme geçmişi silinecek. Emin misin?')) return
    await deleteQuestion(q.id)
    setQuestions(await listQuestionsByExam(q.exam_id))
    if (editingId === q.id) resetForm()
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-bold">Soru Yönetimi</h2>

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-medium">
          {editingId ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
        </h3>

        {!editingId && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-stone-600">Klasör</label>
              <select
                value={folderId}
                onChange={(e) => {
                  setFolderId(e.target.value)
                  setExamId(e.target.value === NEW ? NEW : '')
                }}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              >
                <option value="">Seç…</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
                <option value={NEW}>+ Yeni klasör…</option>
              </select>
              {folderId === NEW && (
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Yeni klasör adı"
                  className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm text-stone-600">Sınav</label>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                disabled={!folderId || folderId === NEW}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 disabled:bg-stone-100"
              >
                <option value="">Seç…</option>
                {folderExams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
                <option value={NEW}>+ Yeni sınav…</option>
              </select>
              {(examId === NEW || folderId === NEW) && (
                <input
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="Yeni sınav adı"
                  className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
                />
              )}
            </div>
          </div>
        )}

        <label className="mb-1 block text-sm text-stone-600">
          Metin parçaları (sırayla)
        </label>
        {parcalar.map((p, i) => (
          <div key={i} className="mb-2 flex items-start gap-2">
            <span className="mt-2 w-16 shrink-0 text-sm text-stone-500">
              Parça {i + 1}
            </span>
            <textarea
              dir="rtl"
              value={p}
              onChange={(e) =>
                setParcalar(parcalar.map((x, j) => (j === i ? e.target.value : x)))
              }
              rows={2}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-right font-arabic text-xl leading-relaxed"
            />
            <button
              onClick={() => setParcalar(parcalar.filter((_, j) => j !== i))}
              disabled={parcalar.length <= 1}
              className="mt-1 rounded-md px-2 py-1 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              title="Parçayı sil"
            >
              🗑
            </button>
          </div>
        ))}
        <button
          onClick={() => setParcalar([...parcalar, ''])}
          className="mb-4 rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-50"
        >
          + Parça Ekle
        </button>

        <label className="mb-1 block text-sm text-stone-600">Nükte</label>
        <textarea
          value={nukte}
          onChange={(e) => setNukte(e.target.value)}
          rows={2}
          placeholder="Bu metin neye misaldir?"
          className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2"
        />

        {message && <p className="mb-3 text-sm text-emerald-700">{message}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => void save()}
            disabled={busy}
            className="rounded-lg bg-stone-800 px-5 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {busy ? 'Kaydediliyor…' : editingId ? 'Güncelle' : 'Kaydet'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-lg bg-stone-200 px-5 py-2 hover:bg-stone-300"
            >
              Vazgeç
            </button>
          )}
        </div>
      </div>

      {realExamSelected && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-medium">
            Bu sınavdaki sorular ({questions.length})
          </h3>
          {questions.length === 0 && (
            <p className="text-sm text-stone-400">Henüz soru yok.</p>
          )}
          {questions.map((q) => (
            <div
              key={q.id}
              className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-stone-200 p-3"
            >
              <div className="min-w-0 flex-1">
                <p
                  dir="rtl"
                  className="truncate text-right font-arabic text-lg text-stone-800"
                >
                  {q.parcalar[0]}
                </p>
                <p className="mt-1 truncate text-sm text-stone-500">
                  {q.parcalar.length} parça — {q.nukte}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(q)}
                  className="rounded-md bg-stone-100 px-2 py-1 text-sm hover:bg-stone-200"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => void remove(q)}
                  className="rounded-md bg-red-50 px-2 py-1 text-sm text-red-600 hover:bg-red-100"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
