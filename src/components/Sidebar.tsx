import { useState } from 'react'
import type { Exam, Folder } from '../types'
import { createExam, createFolder } from '../lib/api'
import ThemeToggle from './ThemeToggle'

interface Props {
  isOpen: boolean
  onClose: () => void
  onOpenHome: () => void
  folders: Folder[]
  exams: Exam[]
  onStartExam: (exam: Exam) => void
  onStartFolder: (folder: Folder) => void
  onOpenExam: (exam: Exam) => void
  onDeleteFolder: (folder: Folder) => void
  onOpenManage: () => void
  onOpenImport: () => void
  onOpenHistory: () => void
  onDataChanged: () => Promise<void>
}

export default function Sidebar({
  isOpen,
  onClose,
  onOpenHome,
  folders,
  exams,
  onStartExam,
  onStartFolder,
  onOpenExam,
  onDeleteFolder,
  onOpenManage,
  onOpenImport,
  onOpenHistory,
  onDataChanged,
}: Props) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [addingExamFor, setAddingExamFor] = useState<string | null>(null)
  const [newExamName, setNewExamName] = useState('')

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submitFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    await createFolder(name)
    setNewFolderName('')
    setAddingFolder(false)
    await onDataChanged()
  }

  const submitExam = async (folderId: string) => {
    const name = newExamName.trim()
    if (!name) return
    await createExam(folderId, name)
    setNewExamName('')
    setAddingExamFor(null)
    setOpenFolders((prev) => new Set(prev).add(folderId))
    await onDataChanged()
  }

  return (
    <aside
      className={`${
        isOpen ? 'flex' : 'hidden md:flex'
      } fixed inset-y-0 left-0 z-40 w-72 max-w-[85%] shrink-0 flex-col border-r border-stone-200 bg-card md:static md:z-auto md:max-w-none`}
    >
      <div className="border-b border-stone-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onOpenHome}
            className="text-lg font-bold hover:text-emerald-700"
            title="Ana sayfaya dön"
          >
            🏠 Ezber Testleri
          </button>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-xl leading-none text-stone-500 hover:bg-stone-100 md:hidden"
              aria-label="Menüyü kapat"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onOpenManage}
            className="flex-1 rounded-lg bg-ink px-3 py-1.5 text-sm text-card hover:bg-ink-h"
          >
            Soru Yönetimi
          </button>
          <button
            onClick={onOpenHistory}
            className="flex-1 rounded-lg bg-stone-200 px-3 py-1.5 text-sm hover:bg-stone-300"
          >
            Geçmiş
          </button>
        </div>
        <button
          onClick={onOpenImport}
          className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
        >
          📥 Toplu Soru Ekle
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {folders.map((folder) => {
          const isOpen = openFolders.has(folder.id)
          const folderExams = exams.filter((e) => e.folder_id === folder.id)
          return (
            <div key={folder.id} className="mb-1">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-medium hover:bg-stone-100"
              >
                <span>
                  {isOpen ? '📂' : '📁'} {folder.name}
                </span>
                <span className="text-xs text-stone-400">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="ml-4 border-l border-stone-200 pl-2">
                  <button
                    onClick={() => onStartFolder(folder)}
                    className="mt-1 w-full rounded-lg bg-emerald-50 px-3 py-1.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    🔀 Tamamından karışık test
                  </button>
                  {folderExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="mt-1 flex items-center justify-between rounded-lg px-3 py-1.5 hover:bg-stone-100"
                    >
                      <button
                        onClick={() => onOpenExam(exam)}
                        className="min-w-0 flex-1 truncate text-left text-sm hover:text-emerald-700"
                        title="Soruları görüntüle / düzenle"
                      >
                        📄 {exam.name}
                      </button>
                      <button
                        onClick={() => onStartExam(exam)}
                        className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs text-white hover:bg-emerald-500"
                      >
                        Test
                      </button>
                    </div>
                  ))}
                  {folderExams.length === 0 && (
                    <p className="px-3 py-1 text-xs text-stone-400">Sınav yok</p>
                  )}
                  {addingExamFor === folder.id ? (
                    <div className="mt-1 flex gap-1 px-1">
                      <input
                        autoFocus
                        value={newExamName}
                        onChange={(e) => setNewExamName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && void submitExam(folder.id)}
                        placeholder="Sınav adı"
                        className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => void submitExam(folder.id)}
                        className="rounded-md bg-ink px-2 text-sm text-card"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingExamFor(folder.id)
                        setNewExamName('')
                      }}
                      className="mt-1 w-full rounded-lg px-3 py-1 text-left text-xs text-stone-500 hover:bg-stone-100"
                    >
                      + Yeni sınav ekle
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteFolder(folder)}
                    className="mt-1 w-full rounded-lg px-3 py-1 text-left text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    🗑 Klasörü sil
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {addingFolder ? (
          <div className="mt-2 flex gap-1 px-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submitFolder()}
              placeholder="Klasör adı (örn: 1. Hafta)"
              className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
            />
            <button
              onClick={() => void submitFolder()}
              className="rounded-md bg-ink px-2 text-sm text-card"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setAddingFolder(true)
              setNewFolderName('')
            }}
            className="mt-2 w-full rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50"
          >
            + Yeni klasör ekle
          </button>
        )}
      </div>
    </aside>
  )
}
