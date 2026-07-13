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
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="mb-1 text-2xl font-bold">Ayet / Şiir Ezber</h1>
      <p className="mb-5 text-sm text-slate-500">
        Bir klasör seçerek başla; sınavın üzerinden kendini test et.
      </p>

      {/* Hızlı erişim */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={onOpenManage}
          className="rounded-xl bg-white p-3 text-center shadow-sm hover:bg-slate-50"
        >
          <div className="text-xl">✏️</div>
          <div className="mt-1 text-xs font-medium sm:text-sm">Soru Yönetimi</div>
        </button>
        <button
          onClick={onOpenImport}
          className="rounded-xl bg-white p-3 text-center shadow-sm hover:bg-slate-50"
        >
          <div className="text-xl">📥</div>
          <div className="mt-1 text-xs font-medium sm:text-sm">Toplu Ekle</div>
        </button>
        <button
          onClick={onOpenHistory}
          className="rounded-xl bg-white p-3 text-center shadow-sm hover:bg-slate-50"
        >
          <div className="text-xl">📊</div>
          <div className="mt-1 text-xs font-medium sm:text-sm">Geçmiş</div>
        </button>
      </div>

      {/* Klasör kartları */}
      <h2 className="mb-3 font-semibold text-slate-700">Klasörler</h2>
      {folders.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
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
                className="rounded-2xl bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-lg font-semibold">📁 {folder.name}</span>
                  <span className="text-slate-300">›</span>
                </div>
                <p className="text-sm text-slate-500">
                  {folderExams.length} sınav · {questionTotal} soru
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
