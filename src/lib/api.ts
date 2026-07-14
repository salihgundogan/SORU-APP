import { getSupabase } from './supabase'
import type { Exam, Folder, Question, Sonuc } from '../types'

export async function listFolders(): Promise<Folder[]> {
  const { data, error } = await getSupabase()
    .from('folders')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data as Folder[]
}

export async function createFolder(name: string): Promise<Folder> {
  const { data, error } = await getSupabase()
    .from('folders')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data as Folder
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const { error } = await getSupabase().from('folders').update({ name }).eq('id', id)
  if (error) throw error
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await getSupabase().from('folders').delete().eq('id', id)
  if (error) throw error
}

export async function listExams(): Promise<Exam[]> {
  const { data, error } = await getSupabase()
    .from('exams')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data as Exam[]
}

export async function createExam(folderId: string, name: string): Promise<Exam> {
  const { data, error } = await getSupabase()
    .from('exams')
    .insert({ folder_id: folderId, name })
    .select()
    .single()
  if (error) throw error
  return data as Exam
}

export async function renameExam(id: string, name: string): Promise<void> {
  const { error } = await getSupabase().from('exams').update({ name }).eq('id', id)
  if (error) throw error
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await getSupabase().from('exams').delete().eq('id', id)
  if (error) throw error
}

/** Kartlarda soru sayısı göstermek için: tüm soruların sadece exam_id'leri. */
export async function listQuestionExamIds(): Promise<{ exam_id: string }[]> {
  const { data, error } = await getSupabase().from('questions').select('exam_id')
  if (error) throw error
  return data as { exam_id: string }[]
}

export async function listQuestionsByExam(examId: string): Promise<Question[]> {
  const { data, error } = await getSupabase()
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('created_at')
  if (error) throw error
  return data as Question[]
}

export async function listQuestionsByExamIds(examIds: string[]): Promise<Question[]> {
  if (examIds.length === 0) return []
  const { data, error } = await getSupabase()
    .from('questions')
    .select('*')
    .in('exam_id', examIds)
  if (error) throw error
  return data as Question[]
}

export async function createQuestion(
  examId: string,
  parcalar: string[],
  nukte: string,
): Promise<Question> {
  const { data, error } = await getSupabase()
    .from('questions')
    .insert({ exam_id: examId, parcalar, nukte })
    .select()
    .single()
  if (error) throw error
  return data as Question
}

export async function updateQuestion(
  id: string,
  parcalar: string[],
  nukte: string,
): Promise<Question> {
  const { data, error } = await getSupabase()
    .from('questions')
    .update({ parcalar, nukte })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Question
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await getSupabase().from('questions').delete().eq('id', id)
  if (error) throw error
}

export async function saveAttempt(
  questionId: string,
  sessionId: string,
  metinSonuc: Sonuc,
  nukteSonuc: Sonuc,
): Promise<void> {
  const { error } = await getSupabase().from('attempts').insert({
    question_id: questionId,
    session_id: sessionId,
    metin_sonuc: metinSonuc,
    nukte_sonuc: nukteSonuc,
  })
  if (error) throw error
}

export interface AttemptRow {
  metin_sonuc: Sonuc
  nukte_sonuc: Sonuc
  question: { exam_id: string } | null
}

export async function listAttemptsWithExam(): Promise<AttemptRow[]> {
  const { data, error } = await getSupabase()
    .from('attempts')
    .select('metin_sonuc, nukte_sonuc, question:questions(exam_id)')
  if (error) throw error
  return data as unknown as AttemptRow[]
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
