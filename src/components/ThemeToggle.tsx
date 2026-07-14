import { useEffect, useState } from 'react'

/**
 * Açık/koyu tema düğmesi. Tercih localStorage'da saklanır;
 * ilk uygulama index.html'deki satır içi script ile yapılır (parlama olmasın).
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      title={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-label="Tema değiştir"
      className="rounded-full p-1.5 leading-none transition hover:bg-stone-200"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
