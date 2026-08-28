import { Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_KEY, writeStorage } from '../lib/storage'
import type { Language } from '../types'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const changeLanguage = (next: Language) => { writeStorage(LANGUAGE_KEY, next); void i18n.changeLanguage(next) }
  return <div className={compact ? 'language-switcher language-compact' : 'language-switcher'}><Globe2 size={15} />{(['en', 'es'] as Language[]).map((item) => <button type="button" key={item} className={language === item ? 'language-active' : ''} onClick={() => changeLanguage(item)}>{item.toUpperCase()}</button>)}</div>
}
