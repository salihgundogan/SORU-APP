import type { Exam, Folder } from '../types'

interface Props {
  folders: Folder[]
  exams: Exam[]
  questionCounts: Map<string, number>
  onOpenFolder: (folder: Folder) => void
  onOpenManage: () => void
  onOpenImport: () => void
  onOpenHistory: () => void
}

export default function HomePage({
  folders,
  exams,
  questionCounts,
  onOpenFolder,
  onOpenManage,
  onOpenImport,
  onOpenHistory,
}: Props) {
  const actions = [
    { icon: '✏️', label: 'Soru Yönetimi', onClick: onOpenManage },
    { icon: '📥', label: 'Toplu Ekle', onClick: onOpenImport },
    { icon: '📊', label: 'Geçmiş', onClick: onOpenHistory },
  ]

  return (
    <div className="mx-auto max-w-3xl animate-fade-up p-4 sm:p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Ayet / Şiir Ezber</h1>
      <p className="mb-6 text-sm text-stone-500">
        Bir klasör seçerek başla; sınavın üzerinden kendini test et.
      </p>

      {/* Hızlı erişim */}
      <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="rounded-2xl border border-stone-200/70 bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
          >
            <div className="text-2xl">{a.icon}</div>
            <div className="mt-1.5 text-xs font-medium text-stone-700 sm:text-sm">
              {a.label}
            </div>
          </button>
        ))}
      </div>

      {/* Klasör kartları */}
      <h2 className="mb-3 text-xs font-semibold tracking-widest text-stone-400 uppercase">
        Klasörler
      </h2>
      {folders.length === 0 ? (
        <p className="rounded-2xl border border-stone-200/70 bg-card p-8 text-center text-sm text-stone-400 shadow-sm">
          Henüz klasör yok — soldaki menüden veya &quot;Toplu Ekle&quot; ile
          oluşturabilirsin.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {folders.map((folder) => {
            const folderExams = exams.filter((e) => e.folder_id === folder.id)
            const questionTotal = folderExams.reduce(
              (n, e) => n + (questionCounts.get(e.id) ?? 0),
              0,
            )
            return (
              <button
                key={folder.id}
                onClick={() => onOpenFolder(folder)}
                className="group flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  📁
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-stone-800">
                    {folder.name}
                  </span>
                  <span className="block text-sm text-stone-500">
                    {folderExams.length} sınav · {questionTotal} soru
                  </span>
                </span>
                <span className="text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-400">
                  ›
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
