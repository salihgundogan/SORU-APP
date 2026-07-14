import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import HomePage from './components/HomePage'
import FolderPage from './components/FolderPage'
import QuestionManager from './components/QuestionManager'
import BulkImport from './components/BulkImport'
import ExamDetail from './components/ExamDetail'
import Quiz from './components/Quiz'
import HistoryView from './components/HistoryView'
import { supabaseConfigured } from './lib/supabase'
import {
  deleteExam,
  deleteFolder,
  listExams,
  listFolders,
  listQuestionExamIds,
  listQuestionsByExam,
  listQuestionsByExamIds,
  renameExam,
  renameFolder,
  shuffle,
} from './lib/api'
import type { Exam, Folder, Question } from './types'

type View =
  | { type: 'home' }
  | { type: 'folder'; folder: Folder }
  | { type: 'exam'; exam: Exam }
  | { type: 'manage' }
  | { type: 'import' }
  | { type: 'history' }
  | { type: 'quiz'; questions: Question[]; title: string; returnTo: View }

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [questionCounts, setQuestionCounts] = useState<Map<string, number>>(new Map())
  const [view, setView] = useState<View>({ type: 'home' })
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mobilde bir görünüm seçilince çekmeceyi kapat.
  const go = (v: View) => {
    setView(v)
    setSidebarOpen(false)
  }

  const reload = useCallback(async () => {
    try {
      const [f, e, q] = await Promise.all([
        listFolders(),
        listExams(),
        listQuestionExamIds(),
      ])
      setFolders(f)
      setExams(e)
      const counts = new Map<string, number>()
      for (const row of q) counts.set(row.exam_id, (counts.get(row.exam_id) ?? 0) + 1)
      setQuestionCounts(counts)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    if (supabaseConfigured) void reload()
  }, [reload])

  if (!supabaseConfigured) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-100 p-8">
        <div className="max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-6 text-stone-800">
          <h1 className="mb-2 text-lg font-bold">Supabase yapılandırması eksik</h1>
          <p className="text-sm leading-6">
            Proje kökündeki <code className="rounded bg-amber-100 px-1">.env</code>{' '}
            dosyasına <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code>{' '}
            ve <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code>{' '}
            değerlerini girip geliştirme sunucusunu yeniden başlat. Değerler Supabase
            Dashboard → Project Settings → API bölümünde.
          </p>
        </div>
      </div>
    )
  }

  /** Bir görünümün "geri" hedefi. */
  const parentOf = (v: View): View => {
    switch (v.type) {
      case 'exam': {
        const folder = folders.find((f) => f.id === v.exam.folder_id)
        return folder ? { type: 'folder', folder } : { type: 'home' }
      }
      case 'quiz':
        return v.returnTo
      default:
        return { type: 'home' }
    }
  }

  const backLabel = (v: View): string => {
    if (v.type === 'exam') {
      const folder = folders.find((f) => f.id === v.exam.folder_id)
      if (folder) return folder.name
    }
    return 'Ana Sayfa'
  }

  const startExamQuiz = async (exam: Exam) => {
    try {
      const questions = await listQuestionsByExam(exam.id)
      if (questions.length === 0) {
        alert('Bu sınavda hiç soru yok.')
        return
      }
      const returnTo: View = view.type === 'quiz' ? view.returnTo : view
      go({ type: 'quiz', questions: shuffle(questions), title: exam.name, returnTo })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const startFolderQuiz = async (folder: Folder) => {
    try {
      const examIds = exams.filter((e) => e.folder_id === folder.id).map((e) => e.id)
      const questions = await listQuestionsByExamIds(examIds)
      if (questions.length === 0) {
        alert('Bu klasörde hiç soru yok.')
        return
      }
      const returnTo: View = view.type === 'quiz' ? view.returnTo : view
      go({
        type: 'quiz',
        questions: shuffle(questions),
        title: `${folder.name} (karışık)`,
        returnTo,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const renameFolderPrompt = async (folder: Folder) => {
    const name = prompt('Klasörün yeni adı:', folder.name)?.trim()
    if (!name || name === folder.name) return
    try {
      await renameFolder(folder.id, name)
      if (view.type === 'folder' && view.folder.id === folder.id) {
        setView({ type: 'folder', folder: { ...folder, name } })
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const renameExamPrompt = async (exam: Exam) => {
    const name = prompt('Sınavın yeni adı:', exam.name)?.trim()
    if (!name || name === exam.name) return
    try {
      await renameExam(exam.id, name)
      if (view.type === 'exam' && view.exam.id === exam.id) {
        setView({ type: 'exam', exam: { ...exam, name } })
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const removeFolder = async (folder: Folder) => {
    const examCount = exams.filter((e) => e.folder_id === folder.id).length
    if (
      !confirm(
        `"${folder.name}" klasörü silinecek: içindeki ${examCount} sınav, tüm sorular ve deneme geçmişi de silinir. Emin misin?`,
      )
    )
      return
    try {
      await deleteFolder(folder.id)
      if (
        (view.type === 'exam' && view.exam.folder_id === folder.id) ||
        (view.type === 'folder' && view.folder.id === folder.id)
      ) {
        setView({ type: 'home' })
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const removeExam = async (exam: Exam) => {
    try {
      await deleteExam(exam.id)
      if (view.type === 'exam' && view.exam.id === exam.id) {
        const folder = folders.find((f) => f.id === exam.folder_id)
        setView(folder ? { type: 'folder', folder } : { type: 'home' })
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  // Odak modu: quiz sırasında yan panel ve üst şerit yok, dikkat dağıtan hiçbir şey kalmaz.
  if (view.type === 'quiz') {
    return (
      <div className="min-h-dvh bg-stone-100 text-stone-900">
        <Quiz
          key={view.title + view.questions.map((q) => q.id).join(',')}
          questions={view.questions}
          title={view.title}
          onExit={() => setView(view.returnTo)}
        />
      </div>
    )
  }

  const showBackBar = view.type !== 'home'

  return (
    <div className="flex h-screen bg-stone-100 text-stone-900">
      {/* Mobil üst şerit */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-stone-200 bg-card px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-2xl leading-none hover:bg-stone-100"
          aria-label="Menüyü aç"
        >
          ☰
        </button>
        <button onClick={() => go({ type: 'home' })} className="text-base font-bold">
          Ayet / Şiir Ezber
        </button>
      </header>

      {/* Mobil çekmece arka planı */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        folders={folders}
        exams={exams}
        onOpenHome={() => go({ type: 'home' })}
        onStartExam={startExamQuiz}
        onStartFolder={startFolderQuiz}
        onOpenManage={() => go({ type: 'manage' })}
        onOpenImport={() => go({ type: 'import' })}
        onOpenExam={(exam) => go({ type: 'exam', exam })}
        onDeleteFolder={removeFolder}
        onOpenHistory={() => go({ type: 'history' })}
        onDataChanged={reload}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {error && (
          <div className="m-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            Hata: {error}
          </div>
        )}

        {/* Geri çubuğu */}
        {showBackBar && (
          <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
            <button
              onClick={() => setView(parentOf(view))}
              className="rounded-lg px-2 py-1 text-sm font-medium text-stone-500 hover:bg-stone-200 hover:text-stone-800"
            >
              ← {backLabel(view)}
            </button>
          </div>
        )}

        {view.type === 'home' && (
          <HomePage
            folders={folders}
            exams={exams}
            questionCounts={questionCounts}
            onOpenFolder={(folder) => go({ type: 'folder', folder })}
            onOpenManage={() => go({ type: 'manage' })}
            onOpenImport={() => go({ type: 'import' })}
            onOpenHistory={() => go({ type: 'history' })}
          />
        )}
        {view.type === 'folder' && (
          <FolderPage
            key={view.folder.id}
            folder={view.folder}
            exams={exams}
            questionCounts={questionCounts}
            onOpenExam={(exam) => go({ type: 'exam', exam })}
            onStartExam={startExamQuiz}
            onStartFolder={startFolderQuiz}
            onRenameFolder={renameFolderPrompt}
          />
        )}
        {view.type === 'manage' && (
          <QuestionManager folders={folders} exams={exams} onDataChanged={reload} />
        )}
        {view.type === 'import' && (
          <BulkImport folders={folders} exams={exams} onDataChanged={reload} />
        )}
        {view.type === 'exam' && (
          <ExamDetail
            key={view.exam.id}
            exam={view.exam}
            onStartExam={startExamQuiz}
            onDeleteExam={removeExam}
            onRenameExam={renameExamPrompt}
          />
        )}
        {view.type === 'history' && <HistoryView folders={folders} exams={exams} />}
      </main>
    </div>
  )
}
