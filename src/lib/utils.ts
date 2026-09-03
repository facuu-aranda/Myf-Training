export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value)
}

export function formatDate(date: string | Date, locale = 'en-US', options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, options ?? { month: 'short', day: 'numeric' }).format(new Date(date))
}

export function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function getDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getStartOfWeek(date = new Date()) {
  const start = new Date(date)
  const day = start.getDay()
  const difference = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + difference)
  start.setHours(0, 0, 0, 0)
  return start
}

export function getWeekday(date = new Date()) {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function daysAgo(days: number, from = new Date()) {
  const value = new Date(from)
  value.setDate(value.getDate() - days)
  return value
}

export function isoDate(date: Date) {
  return getDateKey(date)
}

export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function formatFoodName(name: string, short = false) {
  if (!name || !short) return name
  const parts = name.split(',')
  if (parts.length <= 2) return name
  return `${parts[0].trim()}, ${parts[1].trim()}`
}

export function localizedName(item: { name: string; nameEs: string }, language: 'en' | 'es', short = true) {
  const name = language === 'es' ? item.nameEs : item.name
  return formatFoodName(name, short)
}
