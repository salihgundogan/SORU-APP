import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
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
  listQuestionsByExam,
  listQuestionsByExamIds,
  shuffle,
} from './lib/api'
import type { Exam, Folder, Question } from './types'

type View =
  | { type: 'welcome' }
  | { type: 'manage' }
  | { type: 'import' }
  | { type: 'exam'; exam: Exam }
  | { type: 'history' }
  | { type: 'quiz'; questions: Question[]; title: string }

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [view, setView] = useState<View>({ type: 'welcome' })
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mobilde bir görünüm seçilince çekmeceyi kapat.
  const go = (v: View) => {
    setView(v)
    setSidebarOpen(false)
  }

  const reload = useCallback(async () => {
    try {
      const [f, e] = await Promise.all([listFolders(), listExams()])
      setFolders(f)
      setExams(e)
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
      <div className="flex h-screen items-center justify-center bg-slate-100 p-8">
        <div className="max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-6 text-slate-800">
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

  const startExamQuiz = async (exam: Exam) => {
    try {
      const questions = await listQuestionsByExam(exam.id)
      if (questions.length === 0) {
        alert('Bu sınavda hiç soru yok.')
        return
      }
      go({ type: 'quiz', questions: shuffle(questions), title: exam.name })
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
      go({
        type: 'quiz',
        questions: shuffle(questions),
        title: `${folder.name} (karışık)`,
      })
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
      if (view.type === 'exam' && view.exam.folder_id === folder.id) {
        setView({ type: 'welcome' })
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
        setView({ type: 'welcome' })
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      {/* Mobil üst şerit */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-2xl leading-none hover:bg-slate-100"
          aria-label="Menüyü aç"
        >
          ☰
        </button>
        <h1 className="text-base font-bold">Ayet / Şiir Ezber</h1>
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
        {view.type === 'welcome' && (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <h1 className="mb-3 text-2xl font-bold">Ayet / Şiir Ezber</h1>
              <p className="max-w-md text-slate-600">
                Soldaki panelden bir sınav seçip test başlat, yeni soru eklemek için
                &quot;Soru Yönetimi&quot;ne gir, geçmiş performansın için
                &quot;Geçmiş&quot;e bak.
              </p>
            </div>
          </div>
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
          />
        )}
        {view.type === 'history' && <HistoryView folders={folders} exams={exams} />}
        {view.type === 'quiz' && (
          <Quiz
            key={view.title + view.questions.map((q) => q.id).join(',')}
            questions={view.questions}
            title={view.title}
            onExit={() => setView({ type: 'welcome' })}
          />
        )}
      </main>
    </div>
  )
}
