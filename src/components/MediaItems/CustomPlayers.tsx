'use client'

import { cn } from '@/utilities/ui'
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

type BasePlayerProps = {
  className?: string
  src: string
}

type VideoPlayerProps = BasePlayerProps & {
  poster?: string
  title: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'

  const wholeSeconds = Math.floor(seconds)
  const mins = Math.floor(wholeSeconds / 60)
  const secs = wholeSeconds % 60

  return `${mins}:${String(secs).padStart(2, '0')}`
}

function getProgress(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return Math.min(100, Math.max(0, (currentTime / duration) * 100))
}

export function CustomAudioPlayer({ className, src }: BasePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.85)

  const progress = getProgress(currentTime, duration)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
    audio.muted = isMuted
  }, [isMuted, volume])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      await audio.play()
      setIsPlaying(true)
      return
    }

    audio.pause()
    setIsPlaying(false)
  }

  function seekTo(value: string) {
    const audio = audioRef.current
    if (!audio || !duration) return

    const nextTime = (Number(value) / 100) * duration
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  function skipBy(seconds: number) {
    const audio = audioRef.current
    if (!audio) return

    const nextTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration || audio.duration)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  return (
    <div className={cn('border border-[#e8c4a0] bg-background p-3', className)}>
      <audio
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        preload="metadata"
        ref={audioRef}
        src={src}
      />

      <div className="flex items-center gap-3">
        <IconButton label="Lùi 10 giây" onClick={() => skipBy(-10)}>
          <RotateCcw className="h-4 w-4" />
        </IconButton>
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#8a4b1a] text-white transition-transform duration-150 ease-out active:scale-[0.96]"
          onClick={togglePlay}
          type="button"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          <span className="sr-only">{isPlaying ? 'Tạm dừng' : 'Phát'}</span>
        </button>
        <IconButton label="Tới 10 giây" onClick={() => skipBy(10)}>
          <RotateCw className="h-4 w-4" />
        </IconButton>

        <div className="min-w-0 flex-1">
          <Range
            ariaLabel="Tiến trình audio"
            value={progress}
            onChange={seekTo}
            progress={progress}
          />
          <div className="mt-1 flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <VolumeControl
          isMuted={isMuted}
          onMute={() => setIsMuted((value) => !value)}
          onVolume={(value) => {
            const nextVolume = Number(value) / 100
            setVolume(nextVolume)
            setIsMuted(nextVolume === 0)
          }}
          volume={volume}
        />
      </div>
    </div>
  )
}

function isShellFullscreen(shell: HTMLDivElement | null): boolean {
  if (!shell) return false
  return (
    document.fullscreenElement === shell ||
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ===
      shell
  )
}

export function CustomVideoPlayer({ className, poster, src, title }: VideoPlayerProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.9)

  const progress = getProgress(currentTime, duration)

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(isShellFullscreen(shellRef.current))
    }

    document.addEventListener('fullscreenchange', syncFullscreen)
    document.addEventListener('webkitfullscreenchange', syncFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
      document.removeEventListener('webkitfullscreenchange', syncFullscreen)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.volume = volume
    video.muted = isMuted
  }, [isMuted, volume])

  async function togglePlay() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      await video.play()
      setIsPlaying(true)
      return
    }

    video.pause()
    setIsPlaying(false)
  }

  function seekTo(value: string) {
    const video = videoRef.current
    if (!video || !duration) return

    const nextTime = (Number(value) / 100) * duration
    video.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  async function toggleFullscreen() {
    const shell = shellRef.current
    if (!shell) return

    if (isShellFullscreen(shell)) {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => null)
      } else {
        const doc = document as Document & { webkitExitFullscreen?: () => void }
        doc.webkitExitFullscreen?.()
      }
      return
    }

    if (shell.requestFullscreen) {
      await shell.requestFullscreen().catch(() => null)
      return
    }

    const el = shell as HTMLDivElement & { webkitRequestFullscreen?: () => void }
    el.webkitRequestFullscreen?.()
  }

  const volumeIcon = useMemo(() => {
    if (isMuted || volume === 0) return <VolumeX className="h-4 w-4" />
    if (volume < 0.5) return <Volume1 className="h-4 w-4" />
    return <Volume2 className="h-4 w-4" />
  }, [isMuted, volume])

  return (
    <div
      className={cn(
        'group overflow-hidden border border-border bg-black text-white',
        isFullscreen && 'flex size-full max-h-none flex-col',
        className,
      )}
      ref={shellRef}
    >
      <div
        className={cn(
          'relative aspect-video',
          isFullscreen && 'aspect-auto min-h-0 flex-1',
        )}
      >
        <video
          className="h-full w-full bg-black object-contain"
          onClick={togglePlay}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          playsInline
          poster={poster}
          preload="metadata"
          ref={videoRef}
          src={src}
          title={title}
        />

        {!isPlaying ? (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors duration-200 ease-out hover:bg-black/25"
            onClick={togglePlay}
            type="button"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 text-foreground shadow-sm transition-transform duration-150 ease-out active:scale-[0.96]">
              <Play className="ml-1 h-8 w-8" />
            </span>
            <span className="sr-only">Phát video</span>
          </button>
        ) : null}
      </div>

      <div className={cn('shrink-0 space-y-3 bg-[#101010] p-3', isFullscreen && 'pb-[max(0.75rem,env(safe-area-inset-bottom))]')}>
        <Range
          ariaLabel="Tiến trình video"
          value={progress}
          onChange={seekTo}
          progress={progress}
        />

        <div className="flex items-center gap-3">
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-foreground transition-transform duration-150 ease-out active:scale-[0.96]"
            onClick={togglePlay}
            type="button"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            <span className="sr-only">{isPlaying ? 'Tạm dừng' : 'Phát'}</span>
          </button>

          <div className="text-xs tabular-nums text-white/75">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center text-white/80 transition-colors hover:text-white"
              onClick={() => setIsMuted((value) => !value)}
              type="button"
            >
              {volumeIcon}
              <span className="sr-only">{isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}</span>
            </button>
            <input
              aria-label="Âm lượng video"
              className="h-1.5 w-20 accent-white"
              max={100}
              min={0}
              onChange={(event) => {
                const nextVolume = Number(event.currentTarget.value) / 100
                setVolume(nextVolume)
                setIsMuted(nextVolume === 0)
              }}
              type="range"
              value={isMuted ? 0 : Math.round(volume * 100)}
            />
            <button
              className="flex h-8 w-8 items-center justify-center text-white/80 transition-colors hover:text-white"
              onClick={toggleFullscreen}
              type="button"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="sr-only">{isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-background text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-[0.96]"
      onClick={onClick}
      type="button"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}

function Range({
  ariaLabel,
  onChange,
  progress,
  value,
}: {
  ariaLabel: string
  onChange: (value: string) => void
  progress: number
  value: number
}) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-foreground"
      max={100}
      min={0}
      onChange={(event) => onChange(event.currentTarget.value)}
      style={{
        background: `linear-gradient(to right, currentColor ${progress}%, rgb(229 231 235) ${progress}%)`,
      }}
      type="range"
      value={Number.isFinite(value) ? value : 0}
    />
  )
}

function VolumeControl({
  isMuted,
  onMute,
  onVolume,
  volume,
}: {
  isMuted: boolean
  onMute: () => void
  onVolume: (value: string) => void
  volume: number
}) {
  const Icon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="hidden items-center gap-2 md:flex">
      <button
        className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        onClick={onMute}
        type="button"
      >
        <Icon className="h-4 w-4" />
        <span className="sr-only">{isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}</span>
      </button>
      <input
        aria-label="Âm lượng audio"
        className="h-1.5 w-20 accent-foreground"
        max={100}
        min={0}
        onChange={(event) => onVolume(event.currentTarget.value)}
        type="range"
        value={isMuted ? 0 : Math.round(volume * 100)}
      />
    </div>
  )
}
