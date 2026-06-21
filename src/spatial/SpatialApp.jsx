import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Box, Clapperboard, Expand, Eye, Image, ListMusic, Pause, Play, Rotate3D, Share2, SkipForward, Volume2, VolumeX } from 'lucide-react'
import SpatialScene from './SpatialScene.jsx'

const views = [
  ['faceoff', 'Face-off'],
  ['rebel', 'AORB'],
  ['parliament', 'Parliament'],
]

const playlists = [
  {
    id: 'night-drive',
    title: 'Night Drive Phonk',
    tracks: [
      { id: 'neon-halo-drift', title: 'Neon Halo Drift', src: '/audio/neon-halo-drift.mp3', share: '/spatial/music/neon-halo-drift/' },
      { id: 'distant-signal', title: 'Distant Signal', src: '/audio/neon-insurrection.mp3' },
      { id: 'void-protocol', title: 'Void Protocol', src: '/audio/void-protocol.mp3' },
    ],
  },
  {
    id: 'rebel-techno',
    title: 'Rebel Techno',
    tracks: [
      { id: 'orbital-rebellion', title: 'Orbital Rebellion', src: '/audio/orbital-rebellion.mp3' },
      { id: 'hard-techno-nation', title: 'Hard Techno Nation', src: '/audio/hard-techno-nation.mp3' },
    ],
  },
]

function getInitialMusic() {
  const params = new URLSearchParams(window.location.search)
  const pathTrack = window.location.pathname.match(/\/music\/([^/]+)/)?.[1]
  const requestedPlaylist = params.get('playlist')
  const requestedTrack = params.get('track') || pathTrack
  let playlistIndex = Math.max(0, playlists.findIndex((playlist) => playlist.id === requestedPlaylist || playlist.tracks.some((track) => track.id === requestedTrack)))
  const trackIndex = Math.max(0, playlists[playlistIndex].tracks.findIndex((track) => track.id === requestedTrack))
  return { playlistIndex, trackIndex }
}

export default function SpatialApp() {
  const initialMusic = useRef(getInitialMusic())
  const sceneRef = useRef(null)
  const audioRef = useRef(null)
  const userPausedRef = useRef(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [activeView, setActiveView] = useState('faceoff')
  const [loaded, setLoaded] = useState(false)
  const [cinematic, setCinematic] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'cinematic')
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [playlistIndex, setPlaylistIndex] = useState(initialMusic.current.playlistIndex)
  const [trackIndex, setTrackIndex] = useState(initialMusic.current.trackIndex)
  const [shareStatus, setShareStatus] = useState('')
  const [directorMode, setDirectorMode] = useState(() => new URLSearchParams(window.location.search).get('mode') !== 'cinematic')
  const [playback, setPlayback] = useState({ current: 0, duration: 0 })
  const currentPlaylist = playlists[playlistIndex]
  const currentTrack = currentPlaylist.tracks[trackIndex]
  const handleReady = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    document.body.classList.add('spatial-page')
    return () => document.body.classList.remove('spatial-page')
  }, [])

  useEffect(() => {
    if (!loaded || !directorMode) return
    sceneRef.current?.setDirectorMode(true)
  }, [loaded, directorMode])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    audio.volume = 0.84

    const syncPlaying = () => setAudioPlaying(!audio.paused)
    const syncPlayback = () => setPlayback({ current: audio.currentTime || 0, duration: audio.duration || 0 })
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
    audio.addEventListener('timeupdate', syncPlayback)
    audio.addEventListener('loadedmetadata', syncPlayback)
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    void tryStart()

    return () => {
      audio.pause()
      audio.removeEventListener('play', syncPlaying)
      audio.removeEventListener('pause', syncPlaying)
      audio.removeEventListener('timeupdate', syncPlayback)
      audio.removeEventListener('loadedmetadata', syncPlayback)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || userPausedRef.current) return
    void audio.play().catch(() => setAudioPlaying(false))
  }, [playlistIndex, trackIndex])

  const chooseView = useCallback((view) => {
    setCinematic(false)
    setDirectorMode(false)
    setActiveView(view)
    sceneRef.current?.setDirectorMode(false)
    sceneRef.current?.goTo(view)
  }, [])

  const chooseMode = useCallback((nextCinematic) => {
    setCinematic(nextCinematic)
    const url = new URL(window.location.href)
    url.searchParams.set('mode', nextCinematic ? 'cinematic' : 'spatial')
    window.history.replaceState({}, '', url)
    if (nextCinematic) {
      setAutoRotate(false)
      setDirectorMode(false)
      setActiveView('faceoff')
      sceneRef.current?.setAutoRotate(false)
      sceneRef.current?.setDirectorMode(false)
      sceneRef.current?.goTo('faceoff')
    }
  }, [])

  const toggleRotation = useCallback(() => {
    setCinematic(false)
    setDirectorMode(false)
    sceneRef.current?.setDirectorMode(false)
    setAutoRotate((current) => {
      sceneRef.current?.setAutoRotate(!current)
      return !current
    })
  }, [])

  const toggleDirector = useCallback(() => {
    setCinematic(false)
    setAutoRotate(false)
    setDirectorMode((current) => {
      sceneRef.current?.setAutoRotate(false)
      sceneRef.current?.setDirectorMode(!current)
      return !current
    })
  }, [])

  const seekAudio = useCallback((event) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Number(event.target.value)
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
    if (trackIndex + 1 < currentPlaylist.tracks.length) setTrackIndex(trackIndex + 1)
    else {
      setPlaylistIndex((playlist) => (playlist + 1) % playlists.length)
      setTrackIndex(0)
    }
  }, [currentPlaylist.tracks.length, trackIndex])

  const choosePlaylist = useCallback((event) => {
    setPlaylistIndex(Number(event.target.value))
    setTrackIndex(0)
  }, [])

  const shareTrack = useCallback(async () => {
    const path = currentTrack.share || `/spatial/?playlist=${currentPlaylist.id}&track=${currentTrack.id}`
    const url = new URL(path, window.location.origin).href
    const data = { title: `${currentTrack.title} — AORB`, text: `Listen to ${currentTrack.title} in AORB Spatial 360.`, url }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(url)
        setShareStatus('Link copied')
        window.setTimeout(() => setShareStatus(''), 1800)
      }
    } catch {
      // The native share sheet may be dismissed without choosing a destination.
    }
  }, [currentPlaylist.id, currentTrack])

  return (
    <main className="spatial-shell">
      <audio ref={audioRef} src={currentTrack.src} autoPlay preload="metadata" playsInline onEnded={playNextTrack} />
      <SpatialScene ref={sceneRef} onReady={handleReady} />
      <div className={cinematic ? 'cinematic-layer cinematic-layer--visible' : 'cinematic-layer'} aria-hidden="true">
        <img src="/assets/aorb-faceoff-reference.webp" alt="" width="1672" height="941" />
      </div>

      <header className="spatial-header">
        <a className="spatial-logo" href="/" aria-label="Return to AORB home">AORB<span>.</span></a>
        <div className={directorMode ? 'spatial-status spatial-status--director' : 'spatial-status'}><i /> {directorMode ? 'Live director · audio reactive' : 'Interactive spatial scene'}</div>
        <div className="header-actions">
          <button className={audioPlaying ? 'audio-toggle audio-toggle--playing' : 'audio-toggle'} type="button" onClick={toggleAudio} aria-label={audioPlaying ? `Pause ${currentTrack.title}` : `Play ${currentTrack.title}`} aria-pressed={audioPlaying} title={currentTrack.title}>
            {audioPlaying ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>{audioPlaying ? 'Sound on' : 'Start sound'}</span>
          </button>
          <a className="back-link" href="/"><ArrowLeft size={17} /> Back to site</a>
        </div>
      </header>

      <section className={audioPlaying ? 'now-playing now-playing--active' : 'now-playing'} aria-label="AORB techno player">
        <label className="playlist-selector">
          <ListMusic size={14} />
          <span>Playlist</span>
          <select value={playlistIndex} onChange={choosePlaylist} aria-label="Select music playlist">
            {playlists.map((playlist, index) => <option key={playlist.id} value={index}>{playlist.title}</option>)}
          </select>
        </label>
        <button className="now-playing__play" type="button" onClick={toggleAudio} aria-label={audioPlaying ? 'Pause music' : 'Play music'}>
          {audioPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="now-playing__meta">
          <span>{currentPlaylist.title} · {String(trackIndex + 1).padStart(2, '0')} / {String(currentPlaylist.tracks.length).padStart(2, '0')}</span>
          <strong>{currentTrack.title}</strong>
        </div>
        <div className="now-playing__spectrum" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((bar) => <i key={bar} style={{ '--bar': bar }} />)}
        </div>
        <button className="now-playing__next" type="button" onClick={playNextTrack} aria-label="Play next track">
          <SkipForward size={17} />
        </button>
        <button className="now-playing__share" type="button" onClick={shareTrack} aria-label={`Share ${currentTrack.title}`} title={shareStatus || 'Share track'}>
          <Share2 size={16} />
        </button>
        <input className="now-playing__progress" type="range" min="0" max={playback.duration || 0} step="0.1" value={Math.min(playback.current, playback.duration || 0)} onChange={seekAudio} aria-label="Track progress" />
      </section>

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
        <button className={directorMode ? 'active' : ''} type="button" onClick={toggleDirector} aria-pressed={directorMode}>
          <Clapperboard size={18} /><span>{directorMode ? 'Director on' : 'Director mode'}</span>
        </button>
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
