import { useMemo, useState } from 'react'
import type { Question, QuizResult, Sonuc } from '../types'
import { saveAttempt, shuffle } from '../lib/api'

interface Props {
  questions: Question[]
  title: string
  onExit: () => void
}

interface SonucButtonsProps {
  value: Sonuc | null
  onChange: (v: Sonuc) => void
}

function SonucButtons({ value, onChange }: SonucButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('bildim')}
        className={`h-10 w-10 rounded-full text-lg font-bold transition ${
          value === 'bildim'
            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}
        title="Bildim"
      >
        ✓
      </button>
      <button
        onClick={() => onChange('bilemedim')}
        className={`h-10 w-10 rounded-full text-lg font-bold transition ${
          value === 'bilemedim'
            ? 'bg-red-600 text-white ring-2 ring-red-300'
            : 'bg-red-100 text-red-700 hover:bg-red-200'
        }`}
        title="Bilemedim"
      >
        ✗
      </button>
    </div>
  )
}

export default function Quiz({ questions, title, onExit }: Props) {
  const [pool, setPool] = useState<Question[]>(questions)
  const [index, setIndex] = useState(0)
  const [revealedCount, setRevealedCount] = useState(1)
  const [nukteOpen, setNukteOpen] = useState(false)
  const [metinSonuc, setMetinSonuc] = useState<Sonuc | null>(null)
  const [nukteSonuc, setNukteSonuc] = useState<Sonuc | null>(null)
  const [results, setResults] = useState<QuizResult[]>([])
  const [finished, setFinished] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Aynı test oturumundaki tüm denemeler tek session_id altında toplanır;
  // "tekrar dene" yeni bir oturum başlatır.
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())

  const question = pool[index]
  const bothSelected = metinSonuc !== null && nukteSonuc !== null
  const isLast = index === pool.length - 1

  const resetQuestionState = () => {
    setRevealedCount(1)
    setNukteOpen(false)
    setMetinSonuc(null)
    setNukteSonuc(null)
  }

  const nextQuestion = () => {
    if (!bothSelected) return
    const result: QuizResult = { question, metin: metinSonuc!, nukte: nukteSonuc! }
    setResults((prev) => [...prev, result])
    saveAttempt(question.id, sessionId, metinSonuc!, nukteSonuc!).catch((err) => {
      setSaveError(err instanceof Error ? err.message : String(err))
    })
    if (isLast) {
      setFinished(true)
    } else {
      setIndex(index + 1)
      resetQuestionState()
    }
  }

  const restart = (newPool: Question[]) => {
    setPool(shuffle(newPool))
    setIndex(0)
    setResults([])
    setFinished(false)
    setSessionId(crypto.randomUUID())
    resetQuestionState()
  }

  const wrongQuestions = useMemo(
    () =>
      results
        .filter((r) => r.metin === 'bilemedim' || r.nukte === 'bilemedim')
        .map((r) => r.question),
    [results],
  )

  if (finished) {
    const correct = results.length - wrongQuestions.length
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-xl font-bold">Test Bitti — {title}</h2>
          <p className="mb-6 text-sm text-slate-500">
            Yanlış sayılma kriteri: metin veya nükteden en az biri
            &quot;bilemedim&quot;.
          </p>
          <div className="mb-6 flex gap-4">
            <div className="flex-1 rounded-xl bg-emerald-50 p-4 text-center">
              <div className="text-3xl font-bold text-emerald-700">{correct}</div>
              <div className="text-sm text-emerald-700">Doğru</div>
            </div>
            <div className="flex-1 rounded-xl bg-red-50 p-4 text-center">
              <div className="text-3xl font-bold text-red-700">
                {wrongQuestions.length}
              </div>
              <div className="text-sm text-red-700">Yanlış</div>
            </div>
          </div>
          {saveError && (
            <p className="mb-4 text-sm text-red-600">
              Bazı sonuçlar kaydedilemedi: {saveError}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {wrongQuestions.length > 0 && (
              <button
                onClick={() => restart(wrongQuestions)}
                className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-500"
              >
                Yalnızca yanlışları tekrar dene ({wrongQuestions.length})
              </button>
            )}
            <button
              onClick={() => restart(questions)}
              className="rounded-lg bg-slate-800 px-4 py-2.5 font-medium text-white hover:bg-slate-700"
            >
              Tümünü tekrar dene ({questions.length})
            </button>
            <button
              onClick={onExit}
              className="rounded-lg bg-slate-200 px-4 py-2.5 font-medium hover:bg-slate-300"
            >
              Bitir
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="text-sm text-slate-500">
          Soru {index + 1} / {pool.length}
        </div>
      </div>
      {saveError && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          Kayıt hatası: {saveError}
        </div>
      )}

      {/* Üst şerit: metin parçaları */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-slate-600">Metin</h3>
          <SonucButtons value={metinSonuc} onChange={setMetinSonuc} />
        </div>
        <div className="flex flex-col gap-2">
          {question.parcalar.map((parca, i) => (
            <div
              key={i}
              dir="rtl"
              className={`rounded-xl border p-4 text-right font-arabic text-2xl leading-loose ${
                i < revealedCount
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-dashed border-slate-200 bg-slate-100 text-transparent select-none'
              }`}
            >
              {i < revealedCount ? parca : '•••'}
            </div>
          ))}
        </div>
        {revealedCount < question.parcalar.length && (
          <button
            onClick={() => setRevealedCount(revealedCount + 1)}
            className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
          >
            Sonraki Parçayı Göster ({revealedCount} / {question.parcalar.length})
          </button>
        )}
      </div>

      {/* Alt şerit: nükte */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-slate-600">Nükte</h3>
          <SonucButtons value={nukteSonuc} onChange={setNukteSonuc} />
        </div>
        {nukteOpen ? (
          <div className="rounded-xl border border-slate-200 bg-amber-50 p-4 leading-7">
            {question.nukte}
          </div>
        ) : (
          <button
            onClick={() => setNukteOpen(true)}
            className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500 hover:bg-slate-100"
          >
            Nükteyi göstermek için tıkla
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={nextQuestion}
          disabled={!bothSelected}
          className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
            bothSelected
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'cursor-not-allowed bg-slate-200 text-slate-400'
          }`}
        >
          {isLast ? 'Testi Bitir' : 'Sonraki Soru'}
        </button>
        <button
          onClick={onExit}
          className="rounded-lg bg-slate-200 px-4 py-3 text-sm hover:bg-slate-300"
        >
          Testten Çık
        </button>
      </div>
      {!bothSelected && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Devam etmek için hem metin hem nükte için ✓ veya ✗ seç.
        </p>
      )}
    </div>
  )
}
