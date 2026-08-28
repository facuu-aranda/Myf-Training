import { AnimatePresence, motion, type MotionProps } from 'framer-motion'
import { ArrowUpRight, Check, ChevronDown, LoaderCircle, Search, Sparkles, X } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, MouseEventHandler, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function GlassCard({ children, className, hover = false, ...props }: { children: ReactNode; className?: string; hover?: boolean; onClick?: MouseEventHandler<HTMLDivElement> } & MotionProps) {
  return <motion.div className={cn('glass-card', hover && 'glass-card-hover', className)} {...props}>{children}</motion.div>
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function NeonButton({ children, className, variant = 'primary', size = 'md', loading = false, disabled, ...props }: ButtonProps) {
  return <button className={cn('neon-button', `neon-button-${variant}`, `neon-button-${size}`, className)} disabled={disabled || loading} {...props}>
    {loading ? <LoaderCircle size={16} className="animate-spin" /> : children}
  </button>
}

export function IconButton({ label, children, className, ...props }: ButtonProps & { label: string }) {
  return <button aria-label={label} title={label} className={cn('icon-button', className)} {...props}>{children}</button>
}

export function ProgressRing({ value, size = 116, stroke = 8, color = 'violet', label, sublabel }: { value: number; size?: number; stroke?: number; color?: 'violet' | 'cyan' | 'pink'; label: ReactNode; sublabel?: ReactNode }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference
  const gradientId = `ring-${color}-${size}`
  return <div className="progress-ring" style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value}%`}>
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color === 'cyan' ? '#6ee7f9' : color === 'pink' ? '#ed5cff' : '#b783ff'} /><stop offset="1" stopColor={color === 'cyan' ? '#2dd4bf' : color === 'pink' ? '#f472b6' : '#7c3aed'} /></linearGradient></defs>
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
      <circle className="ring-value" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} stroke={`url(#${gradientId})`} strokeDasharray={circumference} strokeDashoffset={offset} />
    </svg>
    <div className="ring-center"><strong>{label}</strong>{sublabel && <span>{sublabel}</span>}</div>
  </div>
}

export function MetricCard({ label, value, target, icon, accent = 'violet', progress, detail, className }: { label: string; value: ReactNode; target?: ReactNode; icon: ReactNode; accent?: 'violet' | 'cyan' | 'pink' | 'orange'; progress?: number; detail?: ReactNode; className?: string }) {
  return <GlassCard className={cn('metric-card', `accent-${accent}`, className)} hover>
    <div className="metric-card-head"><span className="eyebrow-label">{label}</span><span className="metric-icon">{icon}</span></div>
    <div className="metric-value">{value} {target && <small>/ {target}</small>}</div>
    {progress !== undefined && <div className="progress-track"><span style={{ width: `${Math.min(100, progress)}%` }} /></div>}
    {detail && <div className="metric-detail">{detail}</div>}
  </GlassCard>
}

export function Avatar({ src, name, size = 'md', online = false }: { src?: string; name: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; online?: boolean }) {
  return <span className={cn('avatar-wrap', `avatar-${size}`)}><span className="avatar"><img src={src} alt={name} onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>{name.slice(0, 1).toUpperCase()}</span></span>{online && <i className="online-dot" />}</span>
}

export function StatusPill({ children, tone = 'violet', dot = false }: { children: ReactNode; tone?: 'violet' | 'green' | 'orange' | 'muted'; dot?: boolean }) {
  return <span className={cn('status-pill', `status-${tone}`)}>{dot && <i />} {children}</span>
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow-label">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <span className="eyebrow-label">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>
}

export function Field({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; className?: string }) {
  return <label className={cn('field', className)}>{label && <span>{label}</span>}<input {...props} /></label>
}

export function TextAreaField({ label, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; className?: string }) {
  return <label className={cn('field', className)}>{label && <span>{label}</span>}<textarea {...props} /></label>
}

export function SelectField({ label, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; className?: string }) {
  return <label className={cn('field', className)}>{label && <span>{label}</span>}<span className="select-wrap"><select {...props}>{children}</select><ChevronDown size={15} /></span></label>
}

export function SearchField({ value, onChange, placeholder, className }: { value: string; onChange: (value: string) => void; placeholder: string; className?: string }) {
  return <label className={cn('search-field', className)}><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <IconButton type="button" label="Clear search" onClick={() => onChange('')}><X size={15} /></IconButton>}</label>
}

export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  return <AnimatePresence>{open && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <motion.div className={cn('modal-panel', `modal-${size}`)} role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }} transition={{ duration: .2 }}>
      <div className="modal-topline" /><div className="modal-header">{title && <h2>{title}</h2>}<IconButton type="button" label="Close" onClick={onClose}><X size={18} /></IconButton></div>{children}
    </motion.div>
  </motion.div>}</AnimatePresence>
}

export function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  return <motion.div className="toast" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}><span className="toast-check"><Check size={14} /></span><span>{message}</span>{onClose && <IconButton label="Close notification" onClick={onClose}><X size={14} /></IconButton>}</motion.div>
}

export function EmptyState({ icon = <Sparkles size={20} />, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>
}

export function LinkArrow() {
  return <ArrowUpRight size={15} />
}

export function LoadingState() {
  return <div className="loading-state"><LoaderCircle className="animate-spin" size={22} /></div>
}

export function MiniBar({ value, color = 'violet' }: { value: number; color?: 'violet' | 'cyan' | 'pink' }) {
  return <div className={cn('mini-bar', `mini-${color}`)}><span style={{ height: `${Math.min(100, Math.max(5, value))}%` }} /></div>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" aria-label={label} aria-pressed={checked} className={cn('toggle', checked && 'toggle-on')} onClick={() => onChange(!checked)}><span /></button>
}
