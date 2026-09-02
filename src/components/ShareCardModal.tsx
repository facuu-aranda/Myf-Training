import { Download, Image as ImageIcon, Share2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Profile } from '../types'
import { Modal, NeonButton, StatusPill } from './ui'

export interface ShareCardStat {
  label: string
  value: string
  accent?: string
}

interface ShareCardModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle: string
  tag: string
  stats: ShareCardStat[]
  profiles: Profile[]
  baseImageSrc?: string
  fileName?: string
}

const WIDTH = 1080
const HEIGHT = 1350

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function coverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function drawAvatar(context: CanvasRenderingContext2D, profile: Profile, image: HTMLImageElement | null, x: number, y: number, radius: number, fallbackColor: string) {
  context.save()
  context.beginPath()
  context.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
  context.clip()
  context.fillStyle = fallbackColor
  context.fillRect(x, y, radius * 2, radius * 2)
  if (image) coverImage(context, image, x, y, radius * 2, radius * 2)
  context.restore()
  context.save()
  context.beginPath()
  context.arc(x + radius, y + radius, radius + 5, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(208, 169, 255, .6)'
  context.lineWidth = 3
  context.stroke()
  context.restore()
  if (!image) {
    context.fillStyle = '#ffffff'
    context.font = '600 32px Inter, sans-serif'
    context.textAlign = 'center'
    context.fillText(profile.firstName.slice(0, 1), x + radius, y + radius + 11)
    context.textAlign = 'left'
  }
}

export function ShareCardModal({ open, onClose, title, subtitle, tag, stats, profiles, baseImageSrc = '/share/our-progress-base.png', fileName = 'train-together-share.png' }: ShareCardModalProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasBase, setHasBase] = useState(false)
  const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!open) return undefined
    let active = true
    const render = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      setIsDrawing(true)
      const base = await loadImage(baseImageSrc)
      const avatarImages = await Promise.all(profiles.slice(0, 2).map((profile) => profile.avatarUrl ? loadImage(profile.avatarUrl) : Promise.resolve(null)))
      if (!active) return
      const context = canvas.getContext('2d')
      if (!context) return
      canvas.width = WIDTH
      canvas.height = HEIGHT
      context.clearRect(0, 0, WIDTH, HEIGHT)
      if (base) {
        coverImage(context, base, 0, 0, WIDTH, HEIGHT)
        context.fillStyle = 'rgba(8, 5, 18, .60)'
        context.fillRect(0, 0, WIDTH, HEIGHT)
      } else {
        const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT)
        background.addColorStop(0, '#0c0718'); background.addColorStop(.55, '#1f1232'); background.addColorStop(1, '#09070f')
        context.fillStyle = background; context.fillRect(0, 0, WIDTH, HEIGHT)
        const glow = context.createRadialGradient(1240, 100, 20, 1240, 100, 600)
        glow.addColorStop(0, 'rgba(237, 92, 255, .28)'); glow.addColorStop(1, 'rgba(237, 92, 255, 0)')
        context.fillStyle = glow; context.fillRect(0, 0, WIDTH, HEIGHT)
      }
      setHasBase(Boolean(base))
      context.fillStyle = 'rgba(255,255,255,.07)'; context.fillRect(64, 90, 6, 45)
      context.fillStyle = '#c3a2ff'; context.font = '500 22px "DM Mono", monospace'; context.letterSpacing = '4px'; context.fillText(tag.toUpperCase(), 94, 117)
      context.fillStyle = '#ffffff'; context.font = '600 76px "Space Grotesk", sans-serif'; context.letterSpacing = '-2px'; context.fillText(title, 64, 255)
      context.fillStyle = 'rgba(239,231,249,.72)'; context.font = '400 25px Inter, sans-serif'; context.letterSpacing = '0px'; context.fillText(subtitle, 68, 305)
      const cardX = 64; const cardY = 425; const cardWidth = WIDTH - 128; const cardHeight = 530
      roundedRect(context, cardX, cardY, cardWidth, cardHeight, 28); context.fillStyle = 'rgba(10, 7, 19, .64)'; context.fill(); context.strokeStyle = 'rgba(202, 164, 255, .28)'; context.lineWidth = 2; context.stroke()
      const statWidth = (cardWidth - 64) / Math.max(stats.length, 1)
      stats.forEach((stat, index) => { const x = cardX + 32 + statWidth * index; if (index > 0) { context.fillStyle = 'rgba(255,255,255,.1)'; context.fillRect(x - 1, cardY + 42, 2, cardHeight - 84) } context.fillStyle = stat.accent ?? '#bd9aff'; context.font = '600 43px "Space Grotesk", sans-serif'; context.fillText(stat.value, x + 20, cardY + 205); context.fillStyle = 'rgba(231,222,242,.68)'; context.font = '400 17px Inter, sans-serif'; context.fillText(stat.label.toUpperCase(), x + 20, cardY + 250) })
      profiles.slice(0, 2).forEach((profile, index) => { drawAvatar(context, profile, avatarImages[index], WIDTH - 215 - index * 105, 78, 42, index === 0 ? '#7651cc' : '#c34fbc') })
      context.fillStyle = 'rgba(255,255,255,.45)'; context.font = '500 17px "DM Mono", monospace'; context.fillText('TRAIN TOGETHER  /  2026', 90, HEIGHT - 62)
      context.fillStyle = '#c3a2ff'; context.font = '500 17px "DM Mono", monospace'; context.textAlign = 'right'; context.fillText('GROW TOGETHER', WIDTH - 90, HEIGHT - 62); context.textAlign = 'left'
      setIsDrawing(false)
    }
    void render()
    return () => { active = false }
  }, [baseImageSrc, open, profiles, stats, subtitle, tag, title])

  const download = () => { const canvas = canvasRef.current; if (!canvas) return; try { const link = document.createElement('a'); link.download = fileName; link.href = canvas.toDataURL('image/png'); link.click() } catch { return } }
  const share = async () => { const canvas = canvasRef.current; if (!canvas || !supportsNativeShare) return; const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png')); if (!blob) return; const file = new File([blob], fileName, { type: 'image/png' }); if (!navigator.canShare?.({ files: [file] })) return; try { await navigator.share({ title, text: subtitle, files: [file] }) } catch { return } }
  return <Modal open={open} onClose={onClose} title={t('share.title')} size="lg"><div className="share-modal"><div className="share-preview"><canvas ref={canvasRef} aria-label={t('share.generated')} />{isDrawing && <span className="share-loading"><Sparkles size={16} />{t('common.loading')}</span>}</div><div className="share-controls"><StatusPill tone={hasBase ? 'green' : 'violet'} dot>{hasBase ? t('share.generated') : t('share.baseHint')}</StatusPill><p>{t('share.subtitle')}</p><div className="share-control-actions"><NeonButton size="sm" onClick={download} disabled={isDrawing}><Download size={14} />{t('share.download')}</NeonButton>{supportsNativeShare && <NeonButton variant="secondary" size="sm" onClick={() => { void share() }} disabled={isDrawing}><Share2 size={14} />{t('share.native')}</NeonButton>}</div><span className="share-format"><ImageIcon size={13} /> PNG · 1080 × 1350 · Instagram feed</span></div></div></Modal>
}
