import { useMemo, useState } from 'react'
import type { Exam, Folder } from '../types'
import { createExam, createFolder, createQuestion } from '../lib/api'
import { parseImport } from '../lib/importParser'

interface Props {
  folders: Folder[]
  exams: Exam[]
  onDataChanged: () => Promise<void>
}

const FORMAT_EXAMPLE = `KLASÖR: icaz - itnap - müsavat
SINAV: ayetler

1. birinci sorunun arapça metni
NÜKTE: bu sorunun nüktesi

2. ikinci soru — metni kendin bölmek istersen / eğik çizgi kullan / her biri ayrı parça olur
NÜKTE: ikinci sorunun nüktesi

SINAV: şiirler

1. aynı yapıştırmada ikinci bir sınav da açabilirsin
NÜKTE: ...`

export default function BulkImport({ folders, exams, onDataChanged }: Props) {
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const result = useMemo(() => (raw.trim() === '' ? null : parseImport(raw)), [raw])

  const save = async () => {
    if (!result?.data) return
    setBusy(true)
    setSaveError(null)
    setDoneMessage(null)
    try {
      const { folderName, exams: parsedExams } = result.data

      const existingFolder = folders.find(
        (f) => f.name.trim().toLowerCase() === folderName.toLowerCase(),
      )
      const folder = existingFolder ?? (await createFolder(folderName))

      let total = 0
      for (const parsedExam of parsedExams) {
        const existingExam = exams.find(
          (e) =>
            e.folder_id === folder.id &&
            e.name.trim().toLowerCase() === parsedExam.name.toLowerCase(),
        )
        const exam = existingExam ?? (await createExam(folder.id, parsedExam.name))
        for (const q of parsedExam.questions) {
          await createQuestion(exam.id, q.parcalar, q.nukte)
          total += 1
        }
      }

      await onDataChanged()
      setDoneMessage(
        `${total} soru eklendi → "${folder.name}" klasörü, ${parsedExams
          .map((e) => `"${e.name}" (${e.questions.length})`)
          .join(', ')}.`,
      )
      setRaw('')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="mb-1 text-xl font-bold">Toplu Soru Ekle</h2>
      <p className="mb-4 text-sm text-slate-500">
        Aşağıdaki formata göre yapıştır; klasör ve sınavlar yoksa otomatik oluşturulur,
        varsa mevcut olanlara eklenir.
      </p>

      <details className="mb-4 rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 font-medium text-slate-700">
          📋 Format kuralları
        </summary>
        <div className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600">
          <ul className="mb-3 list-disc pl-5">
            <li>
              İlk satır <code className="rounded bg-slate-100 px-1">KLASÖR: klasör adı</code>{' '}
              olmalı (yapıştırma başına tek klasör).
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1">SINAV: sınav adı</code> satırı yeni
              bir sınav bölümü başlatır; aynı yapıştırmada birden çok sınav olabilir.
            </li>
            <li>
              Her soru <code className="rounded bg-slate-100 px-1">1.</code> gibi numarayla
              başlar; numaradan sonraki metin sorunun metnidir (alt satırlara taşabilir).
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1">NÜKTE:</code> (veya{' '}
              <code className="rounded bg-slate-100 px-1">Mahall-i istişhâd:</code>) satırı o
              sorunun nüktesidir — her soruda zorunlu.
            </li>
            <li>
              Metinde <code className="rounded bg-slate-100 px-1">/</code> varsa parçalar
              oradan bölünür; yoksa otomatik olarak ~4 kelimelik parçalara bölünür.
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1">**kalın**</code> işaretleri,{' '}
              <code className="rounded bg-slate-100 px-1">---</code> ve{' '}
              <code className="rounded bg-slate-100 px-1">##</code> başlık satırları görmezden
              gelinir — Word/ChatGPT çıktısını olduğu gibi yapıştırabilirsin.
            </li>
          </ul>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs leading-5">
            {FORMAT_EXAMPLE}
          </pre>
        </div>
      </details>

      <textarea
        dir="auto"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value)
          setDoneMessage(null)
        }}
        rows={14}
        placeholder={'KLASÖR: …\nSINAV: …\n\n1. metin\nNÜKTE: …'}
        className="mb-4 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm"
      />

      {result && result.errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <p className="mb-1 font-medium">Formatta sorunlar var:</p>
          <ul className="list-disc pl-5">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {result?.data && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 font-medium text-emerald-900">
            Önizleme — 📁 {result.data.folderName}
          </p>
          {result.data.exams.map((exam, i) => (
            <div key={i} className="mb-2">
              <p className="mb-1 text-sm font-medium text-emerald-800">
                📄 {exam.name} — {exam.questions.length} soru
              </p>
              <ul className="space-y-1">
                {exam.questions.map((q, j) => (
                  <li
                    key={j}
                    className="rounded-lg bg-white/70 px-3 py-1.5 text-sm text-slate-700"
                  >
                    <span dir="rtl" className="font-arabic text-base">
                      {q.parcalar[0]}
                      {q.parcalar.length > 1 ? ' …' : ''}
                    </span>
                    <span className="text-xs text-slate-500">
                      {' '}
                      · {q.parcalar.length} parça · {q.nukte.slice(0, 60)}
                      {q.nukte.length > 60 ? '…' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {saveError && (
        <p className="mb-3 text-sm text-red-600">Kayıt hatası: {saveError}</p>
      )}
      {doneMessage && (
        <p className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          ✅ {doneMessage}
        </p>
      )}

      <button
        onClick={() => void save()}
        disabled={busy || !result?.data}
        className="rounded-lg bg-slate-800 px-5 py-2.5 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? 'Kaydediliyor…'
          : result?.data
            ? `${result.data.exams.reduce((n, e) => n + e.questions.length, 0)} soruyu kaydet`
            : 'Kaydet'}
      </button>
    </div>
  )
}
