import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Expand, Eye, Pause, Play, Rotate3D } from 'lucide-react'
import SpatialScene from './SpatialScene.jsx'

const views = [
  ['faceoff', 'Face-off'],
  ['rebel', 'AORB'],
  ['parliament', 'Parliament'],
]

export default function SpatialApp() {
  const sceneRef = useRef(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [activeView, setActiveView] = useState('faceoff')
  const [loaded, setLoaded] = useState(false)
  const handleReady = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    document.body.classList.add('spatial-page')
    return () => document.body.classList.remove('spatial-page')
  }, [])

  const chooseView = useCallback((view) => {
    setActiveView(view)
    sceneRef.current?.goTo(view)
  }, [])

  const toggleRotation = useCallback(() => {
    setAutoRotate((current) => {
      sceneRef.current?.setAutoRotate(!current)
      return !current
    })
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.()
    else await document.exitFullscreen?.()
  }, [])

  return (
    <main className="spatial-shell">
      <SpatialScene ref={sceneRef} onReady={handleReady} />

      <header className="spatial-header">
        <a className="spatial-logo" href="/" aria-label="Return to AORB home">AORB<span>.</span></a>
        <div className="spatial-status"><i /> Interactive spatial scene</div>
        <a className="back-link" href="/"><ArrowLeft size={17} /> Back to site</a>
      </header>

      <section className="spatial-copy" aria-label="Scene introduction">
        <h1>Enter the<br />new Europe<span>.</span></h1>
        <p>Rotate the chamber. Inspect the face-off. See the movement from every angle.</p>
      </section>

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
