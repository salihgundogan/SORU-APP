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
        aria-label="Bildim"
        title="Bildim"
        className={`h-11 w-11 rounded-full text-xl font-bold transition-all ${
          value === 'bildim'
            ? 'scale-105 bg-emerald-600 text-white shadow-md shadow-emerald-200'
            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
        }`}
      >
        ✓
      </button>
      <button
        onClick={() => onChange('bilemedim')}
        aria-label="Bilemedim"
        title="Bilemedim"
        className={`h-11 w-11 rounded-full text-xl font-bold transition-all ${
          value === 'bilemedim'
            ? 'scale-105 bg-rose-600 text-white shadow-md shadow-rose-200'
            : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
        }`}
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
    const pct = results.length > 0 ? Math.round((correct / results.length) * 100) : 0
    const emoji = pct === 100 ? '🎉' : pct >= 70 ? '👏' : pct >= 40 ? '💪' : '📖'
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-up rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">{emoji}</div>
          <h2 className="mt-3 text-xl font-bold">Test Bitti</h2>
          <p className="text-sm text-stone-500">{title}</p>

          <div className="my-5 text-5xl font-bold tracking-tight text-emerald-600">
            %{pct}
          </div>

          <div className="mb-6 flex justify-center gap-3">
            <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              {correct} doğru
            </span>
            <span className="rounded-full bg-rose-50 px-4 py-1.5 text-sm font-medium text-rose-600">
              {wrongQuestions.length} yanlış
            </span>
          </div>

          {saveError && (
            <p className="mb-4 text-sm text-rose-600">
              Bazı sonuçlar kaydedilemedi: {saveError}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {wrongQuestions.length > 0 && (
              <button
                onClick={() => restart(wrongQuestions)}
                className="rounded-xl bg-rose-600 px-4 py-3 font-medium text-white transition hover:bg-rose-500 active:scale-[.99]"
              >
                Yalnızca yanlışları tekrar dene ({wrongQuestions.length})
              </button>
            )}
            <button
              onClick={() => restart(questions)}
              className="rounded-xl bg-stone-800 px-4 py-3 font-medium text-white transition hover:bg-stone-700 active:scale-[.99]"
            >
              Tümünü tekrar dene ({questions.length})
            </button>
            <button
              onClick={onExit}
              className="rounded-xl bg-stone-100 px-4 py-3 font-medium text-stone-600 transition hover:bg-stone-200"
            >
              Bitir
            </button>
          </div>

          <p className="mt-5 text-xs text-stone-400">
            Metin veya nükteden en az biri &quot;bilemedim&quot; ise soru yanlış sayılır.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col p-4 sm:p-6">
      {/* Üst çubuk: çık + başlık + sayaç */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={onExit}
          aria-label="Testten çık"
          title="Testten çık"
          className="rounded-full p-2 leading-none text-stone-400 transition hover:bg-stone-200 hover:text-stone-700"
        >
          ✕
        </button>
        <div className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-stone-600">
          {title}
        </div>
        <div className="text-sm font-medium tabular-nums text-stone-400">
          {index + 1}/{pool.length}
        </div>
      </div>

      {/* İlerleme çubuğu */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(index / pool.length) * 100}%` }}
        />
      </div>

      {saveError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Kayıt hatası: {saveError}
        </div>
      )}

      {/* Metin kartı */}
      <div
        key={question.id}
        className="mb-4 animate-fade-up rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
            Metin
          </h3>
          <SonucButtons value={metinSonuc} onChange={setMetinSonuc} />
        </div>
        <div className="flex flex-col gap-2">
          {question.parcalar.map((parca, i) =>
            i < revealedCount ? (
              <div
                key={i}
                dir="rtl"
                className="animate-fade-up rounded-xl bg-stone-50 px-4 py-3 text-right font-arabic text-2xl leading-loose text-stone-800 sm:text-3xl sm:leading-loose"
              >
                {parca}
              </div>
            ) : (
              <div
                key={i}
                className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-6"
              />
            ),
          )}
        </div>
        {revealedCount < question.parcalar.length && (
          <button
            onClick={() => setRevealedCount(revealedCount + 1)}
            className="mt-4 w-full rounded-xl bg-stone-800 px-4 py-3 font-medium text-white transition hover:bg-stone-700 active:scale-[.99]"
          >
            Sonraki Parçayı Göster
            <span className="ml-2 text-sm text-stone-400">
              {revealedCount}/{question.parcalar.length}
            </span>
          </button>
        )}
      </div>

      {/* Nükte kartı */}
      <div className="mb-6 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
            Nükte
          </h3>
          <SonucButtons value={nukteSonuc} onChange={setNukteSonuc} />
        </div>
        {nukteOpen ? (
          <div className="animate-fade-up rounded-xl bg-amber-50 px-4 py-3 leading-7 text-stone-800">
            {question.nukte}
          </div>
        ) : (
          <button
            onClick={() => setNukteOpen(true)}
            className="w-full rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-stone-500 transition hover:bg-stone-100"
          >
            💡 Nükteyi göstermek için tıkla
          </button>
        )}
      </div>

      {/* Sonraki soru */}
      <div className="mt-auto pb-2">
        <button
          onClick={nextQuestion}
          disabled={!bothSelected}
          className={`w-full rounded-xl px-4 py-3.5 text-base font-semibold transition ${
            bothSelected
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100 hover:bg-emerald-500 active:scale-[.99]'
              : 'cursor-not-allowed bg-stone-200 text-stone-400'
          }`}
        >
          {isLast ? 'Testi Bitir' : 'Sonraki Soru →'}
        </button>
        {!bothSelected && (
          <p className="mt-2 text-center text-xs text-stone-400">
            Devam etmek için hem metin hem nükte için ✓ veya ✗ seç.
          </p>
        )}
      </div>
    </div>
  )
}
