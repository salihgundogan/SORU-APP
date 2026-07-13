import type { Exam, Folder } from '../types'

interface Props {
  folder: Folder
  exams: Exam[]
  questionCounts: Map<string, number>
  onOpenExam: (exam: Exam) => void
  onStartExam: (exam: Exam) => void
  onStartFolder: (folder: Folder) => void
}

export default function FolderPage({
  folder,
  exams,
  questionCounts,
  onOpenExam,
  onStartExam,
  onStartFolder,
}: Props) {
  const folderExams = exams.filter((e) => e.folder_id === folder.id)
  const questionTotal = folderExams.reduce(
    (n, e) => n + (questionCounts.get(e.id) ?? 0),
    0,
  )

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">📂 {folder.name}</h1>
          <p className="text-sm text-slate-500">
            {folderExams.length} sınav · {questionTotal} soru
          </p>
        </div>
        {questionTotal > 0 && (
          <button
            onClick={() => onStartFolder(folder)}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
          >
            🔀 Tamamından Karışık Test
          </button>
        )}
      </div>

      {folderExams.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          Bu klasörde henüz sınav yok — soldaki menüden ekleyebilirsin.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {folderExams.map((exam) => {
            const count = questionCounts.get(exam.id) ?? 0
            return (
              <div key={exam.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-1 text-lg font-semibold">📄 {exam.name}</div>
                <p className="mb-3 text-sm text-slate-500">{count} soru</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartExam(exam)}
                    disabled={count === 0}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ▶ Test
                  </button>
                  <button
                    onClick={() => onOpenExam(exam)}
                    className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium hover:bg-slate-200"
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
