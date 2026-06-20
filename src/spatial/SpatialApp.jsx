import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Box, Expand, Eye, Image, Pause, Play, Rotate3D, Volume2, VolumeX } from 'lucide-react'
import SpatialScene from './SpatialScene.jsx'

const views = [
  ['faceoff', 'Face-off'],
  ['rebel', 'AORB'],
  ['parliament', 'Parliament'],
]

const tracks = [
  { title: 'Void Protocol', src: '/audio/void-protocol.mp3' },
  { title: 'Neon Insurrection', src: '/audio/neon-insurrection.mp3' },
  { title: 'Orbital Rebellion', src: '/audio/orbital-rebellion.mp3' },
  { title: 'Hard Techno Nation', src: '/audio/hard-techno-nation.mp3' },
]

export default function SpatialApp() {
  const sceneRef = useRef(null)
  const audioRef = useRef(null)
  const userPausedRef = useRef(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [activeView, setActiveView] = useState('faceoff')
  const [loaded, setLoaded] = useState(false)
  const [cinematic, setCinematic] = useState(() => new URLSearchParams(window.location.search).get('mode') !== 'spatial')
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)
  const currentTrack = tracks[trackIndex]
  const handleReady = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    document.body.classList.add('spatial-page')
    return () => document.body.classList.remove('spatial-page')
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    audio.volume = 0.68

    const syncPlaying = () => setAudioPlaying(!audio.paused)
    const tryStart = async () => {
      if (userPausedRef.current) return
      try {
        await audio.play()
      } catch {
        // Browsers unlock audible autoplay after the first user gesture.
      }
    }
    const unlock = () => {
      sceneRef.current?.connectAudio(audio)
      void tryStart()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }

    audio.addEventListener('play', syncPlaying)
    audio.addEventListener('pause', syncPlaying)
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    void tryStart()

    return () => {
      audio.pause()
      audio.removeEventListener('play', syncPlaying)
      audio.removeEventListener('pause', syncPlaying)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || userPausedRef.current) return
    void audio.play().catch(() => setAudioPlaying(false))
  }, [trackIndex])

  const chooseView = useCallback((view) => {
    setCinematic(false)
    setActiveView(view)
    sceneRef.current?.goTo(view)
  }, [])

  const chooseMode = useCallback((nextCinematic) => {
    setCinematic(nextCinematic)
    if (nextCinematic) {
      setAutoRotate(false)
      setActiveView('faceoff')
      sceneRef.current?.setAutoRotate(false)
      sceneRef.current?.goTo('faceoff')
    }
  }, [])

  const toggleRotation = useCallback(() => {
    setCinematic(false)
    setAutoRotate((current) => {
      sceneRef.current?.setAutoRotate(!current)
      return !current
    })
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.()
    else await document.exitFullscreen?.()
  }, [])

  const toggleAudio = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    sceneRef.current?.connectAudio(audio)
    if (audio.paused) {
      userPausedRef.current = false
      try {
        await audio.play()
      } catch {
        setAudioPlaying(false)
      }
    } else {
      userPausedRef.current = true
      audio.pause()
    }
  }, [])

  const playNextTrack = useCallback(() => {
    setTrackIndex((current) => (current + 1) % tracks.length)
  }, [])

  return (
    <main className="spatial-shell">
      <audio ref={audioRef} src={currentTrack.src} autoPlay preload="metadata" playsInline onEnded={playNextTrack} />
      <SpatialScene ref={sceneRef} onReady={handleReady} />
      <div className={cinematic ? 'cinematic-layer cinematic-layer--visible' : 'cinematic-layer'} aria-hidden="true">
        <img src="/assets/aorb-faceoff-reference.webp" alt="" width="1672" height="941" />
      </div>

      <header className="spatial-header">
        <a className="spatial-logo" href="/" aria-label="Return to AORB home">AORB<span>.</span></a>
        <div className="spatial-status"><i /> Interactive spatial scene</div>
        <div className="header-actions">
          <button className={audioPlaying ? 'audio-toggle audio-toggle--playing' : 'audio-toggle'} type="button" onClick={toggleAudio} aria-label={audioPlaying ? `Pause ${currentTrack.title}` : `Play ${currentTrack.title}`} aria-pressed={audioPlaying} title={currentTrack.title}>
            {audioPlaying ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>{audioPlaying ? `Pause · ${currentTrack.title}` : `Start · ${currentTrack.title}`}</span>
          </button>
          <a className="back-link" href="/"><ArrowLeft size={17} /> Back to site</a>
        </div>
      </header>

      <div className="mode-switch" aria-label="Presentation mode">
        <button type="button" className={cinematic ? 'active' : ''} onClick={() => chooseMode(true)}><Image size={16} /> Cinematic</button>
        <button type="button" className={!cinematic ? 'active' : ''} onClick={() => chooseMode(false)}><Box size={16} /> Spatial 360</button>
      </div>

      <aside className="view-controls" aria-label="Camera views">
        <span>Camera</span>
        {views.map(([view, label]) => (
          <button key={view} className={activeView === view ? 'active' : ''} type="button" onClick={() => chooseView(view)}>
            <Eye size={16} /> {label}
          </button>
        ))}
      </aside>

      <div className="spatial-toolbar">
        <button type="button" onClick={toggleRotation} aria-pressed={autoRotate}>
          {autoRotate ? <Pause size={18} /> : <Play size={18} />}
          <span>{autoRotate ? 'Pause orbit' : 'Auto orbit'}</span>
        </button>
        <button type="button" onClick={() => chooseView('free')}>
          <Rotate3D size={18} /><span>Free view</span>
        </button>
        <button type="button" onClick={enterFullscreen}>
          <Expand size={18} /><span>Fullscreen</span>
        </button>
      </div>

      <div className="spatial-help">Drag to rotate <b>·</b> Pinch or scroll to zoom <b>·</b> Two-finger drag to move</div>

      <div className={loaded ? 'spatial-loader spatial-loader--done' : 'spatial-loader'} aria-live="polite">
        <div className="loader-mark">A</div>
        <p>Constructing the chamber</p>
        <span />
      </div>
    </main>
  )
}
