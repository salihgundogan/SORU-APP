import type { Exam, Folder } from '../types'

interface Props {
  folder: Folder
  exams: Exam[]
  questionCounts: Map<string, number>
  onOpenExam: (exam: Exam) => void
  onStartExam: (exam: Exam) => void
  onStartFolder: (folder: Folder) => void
  onRenameFolder: (folder: Folder) => void
}

export default function FolderPage({
  folder,
  exams,
  questionCounts,
  onOpenExam,
  onStartExam,
  onStartFolder,
  onRenameFolder,
}: Props) {
  const folderExams = exams.filter((e) => e.folder_id === folder.id)
  const questionTotal = folderExams.reduce(
    (n, e) => n + (questionCounts.get(e.id) ?? 0),
    0,
  )

  return (
    <div className="mx-auto max-w-3xl animate-fade-up p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            📂 {folder.name}
            <button
              onClick={() => onRenameFolder(folder)}
              title="Klasörü yeniden adlandır"
              aria-label="Klasörü yeniden adlandır"
              className="rounded-lg p-1 text-sm text-stone-400 transition hover:bg-stone-200 hover:text-stone-700"
            >
              ✏️
            </button>
          </h1>
          <p className="text-sm text-stone-500">
            {folderExams.length} sınav · {questionTotal} soru
          </p>
        </div>
        {questionTotal > 0 && (
          <button
            onClick={() => onStartFolder(folder)}
            className="shrink-0 rounded-xl bg-ink px-4 py-2.5 font-medium text-card transition hover:bg-ink-h active:scale-[.99]"
          >
            🔀 Tamamından Karışık Test
          </button>
        )}
      </div>

      {folderExams.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-center text-sm text-stone-400 shadow-sm">
          Bu klasörde henüz sınav yok — soldaki menüden ekleyebilirsin.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {folderExams.map((exam) => {
            const count = questionCounts.get(exam.id) ?? 0
            return (
              <div
                key={exam.id}
                className="rounded-2xl border border-stone-200/70 bg-card p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-1 text-lg font-semibold">📄 {exam.name}</div>
                <p className="mb-3 text-sm text-stone-500">{count} soru</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartExam(exam)}
                    disabled={count === 0}
                    className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ▶ Test
                  </button>
                  <button
                    onClick={() => onOpenExam(exam)}
                    className="flex-1 rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
                  >
                    Sorular
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
