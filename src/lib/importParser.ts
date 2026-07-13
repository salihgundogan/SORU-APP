export interface ParsedQuestion {
  text: string
  nukte: string
  parcalar: string[]
}

export interface ParsedExam {
  name: string
  questions: ParsedQuestion[]
}

export interface ParsedImport {
  folderName: string
  exams: ParsedExam[]
}

export interface ParseResult {
  data: ParsedImport | null
  errors: string[]
}

/**
 * Metni parçalara böler: "/" varsa oradan, yoksa otomatik olarak
 * 4'er kelimelik gruplara ayırır (tek kelimelik artık son parçaya eklenir).
 */
export function splitParcalar(text: string): string[] {
  const clean = text.trim()
  if (clean.includes('/')) {
    return clean
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s !== '')
  }
  const words = clean.split(/\s+/).filter((w) => w !== '')
  if (words.length <= 5) return [clean]
  const chunkSize = 4
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  if (chunks.length > 1 && chunks[chunks.length - 1].split(' ').length === 1) {
    const last = chunks.pop()!
    chunks[chunks.length - 1] += ' ' + last
  }
  return chunks
}

const FOLDER_RE = /^\*{0,2}klas[öo]r\*{0,2}\s*:\s*(.+)$/i
const EXAM_RE = /^\*{0,2}s[ıi]nav\*{0,2}\s*\d*\s*:\s*(.+)$/i
const QUESTION_RE = /^\*{0,2}(\d+)[.)]\*{0,2}\s*(.*)$/
const NUKTE_RE = /^\*{0,2}(?:n[üu]kte|mahall-i isti[şs]h[âa]d)\*{0,2}\s*:\s*(.*)$/i

/** "**metin**" → "metin" gibi markdown kalın işaretlerini temizler. */
function stripMd(line: string): string {
  return line.replace(/\*\*/g, '').trim()
}

export function parseImport(raw: string): ParseResult {
  const errors: string[] = []
  let folderName: string | null = null
  const exams: ParsedExam[] = []
  let currentExam: ParsedExam | null = null
  let currentText: string | null = null
  let currentNukte: string | null = null
  let currentNumber: string | null = null

  const flushQuestion = () => {
    if (currentText === null) return
    if (!currentExam) {
      errors.push(`Madde ${currentNumber}: SINAV satırından önce soru başlatılamaz.`)
    } else if (currentNukte === null || currentNukte.trim() === '') {
      errors.push(`Madde ${currentNumber} ("${currentText.slice(0, 30)}…"): NÜKTE satırı eksik.`)
    } else if (currentText.trim() === '') {
      errors.push(`Madde ${currentNumber}: metin boş.`)
    } else {
      currentExam.questions.push({
        text: currentText.trim(),
        nukte: currentNukte.trim(),
        parcalar: splitParcalar(currentText),
      })
    }
    currentText = null
    currentNukte = null
    currentNumber = null
  }

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line === '---' || line.startsWith('#')) continue

    const folderMatch = line.match(FOLDER_RE)
    if (folderMatch) {
      flushQuestion()
      if (folderName !== null) {
        errors.push('Birden fazla KLASÖR satırı var — tek klasör destekleniyor.')
      }
      folderName = stripMd(folderMatch[1])
      continue
    }

    const examMatch = line.match(EXAM_RE)
    if (examMatch) {
      flushQuestion()
      currentExam = { name: stripMd(examMatch[1]), questions: [] }
      exams.push(currentExam)
      continue
    }

    const nukteMatch = line.match(NUKTE_RE)
    if (nukteMatch) {
      if (currentText === null) {
        errors.push(`"${line.slice(0, 40)}…": numaralı bir maddeye ait değil.`)
        continue
      }
      currentNukte = stripMd(nukteMatch[1])
      continue
    }

    const questionMatch = line.match(QUESTION_RE)
    if (questionMatch) {
      flushQuestion()
      currentNumber = questionMatch[1]
      currentText = stripMd(questionMatch[2])
      continue
    }

    // Devam satırı: nükteye ya da metne eklenir.
    if (currentNukte !== null) {
      currentNukte += ' ' + stripMd(line)
    } else if (currentText !== null) {
      currentText += ' ' + stripMd(line)
    }
    // Hiçbir bağlama oturmayan satırlar (başlık vb.) sessizce atlanır.
  }
  flushQuestion()

  if (folderName === null) errors.push('KLASÖR: satırı bulunamadı.')
  if (exams.length === 0) errors.push('SINAV: satırı bulunamadı.')
  for (const exam of exams) {
    if (exam.questions.length === 0) {
      errors.push(`"${exam.name}" sınavında hiç soru yok.`)
    }
  }

  if (errors.length > 0 || folderName === null) return { data: null, errors }
  return { data: { folderName, exams }, errors }
}
