import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import QuestionManager from './components/QuestionManager'
import BulkImport from './components/BulkImport'
import Quiz from './components/Quiz'
import HistoryView from './components/HistoryView'
import { supabaseConfigured } from './lib/supabase'
import {
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
  | { type: 'history' }
  | { type: 'quiz'; questions: Question[]; title: string }

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [view, setView] = useState<View>({ type: 'welcome' })
  const [error, setError] = useState<string | null>(null)

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
      setView({ type: 'quiz', questions: shuffle(questions), title: exam.name })
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
      setView({
        type: 'quiz',
        questions: shuffle(questions),
        title: `${folder.name} (karışık)`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      <Sidebar
        folders={folders}
        exams={exams}
        onStartExam={startExamQuiz}
        onStartFolder={startFolderQuiz}
        onOpenManage={() => setView({ type: 'manage' })}
        onOpenImport={() => setView({ type: 'import' })}
        onOpenHistory={() => setView({ type: 'history' })}
        onDataChanged={reload}
      />
      <main className="flex-1 overflow-y-auto">
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
