export interface Folder {
  id: string
  name: string
  created_at: string
}

export interface Exam {
  id: string
  folder_id: string
  name: string
  created_at: string
}

export interface Question {
  id: string
  exam_id: string
  parcalar: string[]
  nukte: string
  created_at: string
}

export type Sonuc = 'bildim' | 'bilemedim'

export interface Attempt {
  id: string
  question_id: string
  session_id: string
  metin_sonuc: Sonuc
  nukte_sonuc: Sonuc
  created_at: string
}

export interface QuizResult {
  question: Question
  metin: Sonuc
  nukte: Sonuc
}
