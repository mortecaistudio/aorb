import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ExternalLink, Menu, X } from 'lucide-react'

const commitments = [
  ['Democracy people can control', 'Public decisions must be transparent, understandable and accountable. People need meaningful ways to participate between elections.'],
  ['A dignified life for everyone', 'Housing, healthcare, education, food, energy and mobility must remain accessible.'],
  ['Government without hidden influence', 'Political funding, lobbying and public contracts must be radically transparent.'],
  ['A fair economy', 'Work should provide dignity, security and fair compensation.'],
  ['Housing is a foundation', 'Europe needs more affordable homes and stronger protection against exploitation.'],
  ['Technology under democratic control', 'Artificial intelligence and digital platforms must serve human freedom.'],
  ['Education for a changing world', 'Education should cultivate creativity, practical capability and critical thinking throughout life.'],
  ['Climate action that improves daily life', 'The ecological transition must produce cleaner cities, reliable transport and skilled employment.'],
  ['A Europe that protects freedom', 'Europe must defend dignity, civil liberties, equality before the law and peaceful disagreement.'],
  ['Responsibility to the future', 'Political decisions must account for their long-term effects on generations who will inherit them.'],
]

const methods = [
  ['01', 'Participate', 'Shape proposals through peaceful democratic action.'],
  ['02', 'Publish', 'Share evidence and policy assumptions openly.'],
  ['03', 'Measure', 'Track outcomes with clear public data.'],
  ['04', 'Revise', 'Change what fails. Improve what works.'],
]

function ArrowLink({ href, children, variant = 'primary', download }) {
  return (
    <a className={`action action--${variant}`} href={href} download={download}>
      <span>{children}</span><ArrowRight aria-hidden="true" size={19} strokeWidth={1.7} />
    </a>
  )
}

function Logo() {
  return <a className="logo" href="#top" aria-label="AORB home">AORB<span /></a>
}

function Header() {
  const [open, setOpen] = useState(false)
  const links = [['Manifesto', '#manifesto'], ['Commitments', '#commitments'], ['Method', '#method'], ['Contact', '#contact']]

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    const closeOnEscape = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <header className="header">
      <Logo />
      <button className="menu-button" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(v => !v)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav id="primary-navigation" className={open ? 'nav nav--open' : 'nav'} aria-label="Primary navigation">
        <div className="nav__identity">
          <span>AORB</span>
          <p>Alliance of Rebels Europe</p>
        </div>
        <div className="nav__links">
          {links.map(([label, href], index) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              <span>{String(index + 1).padStart(2, '0')}</span>{label}<ArrowRight aria-hidden="true" />
            </a>
          ))}
        </div>
        <div className="nav__footer">
          <p>Europe's next political generation.</p>
          <a href="/AORB_Brand_Identity_and_Manifesto.pdf" download onClick={() => setOpen(false)}>Founding document <ExternalLink aria-hidden="true" /></a>
        </div>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <Header />
      <div className="hero__image" aria-hidden="true" />
      <div className="hero__content">
        <div className="hero__identity">
          <span>AORB / Europe</span>
          <strong>Alliance of Rebels Europe</strong>
        </div>
        <h1>Europe<br />must<br />evolve<span>.</span></h1>
        <p>A new European political movement for the generation that will inherit what comes next. Rebellion is the discipline to reject what no longer works — and construct something better.</p>
        <div className="actions">
          <ArrowLink href="#manifesto">Read the manifesto</ArrowLink>
          <ArrowLink href="#commitments" variant="outline">Explore the 10 commitments</ArrowLink>
        </div>
      </div>
      <div className="hero__proof" aria-label="Our political method">
        <span>Democratic</span><span>Peaceful</span><span>Measurable</span>
      </div>
      <a className="scroll-cue" href="#manifesto" aria-label="Scroll to manifesto"><ArrowDown /></a>
      <div className="signal-line" aria-hidden="true"><span /><span /><span /></div>
    </section>
  )
}

function Manifesto() {
  return (
    <section className="manifesto" id="manifesto">
      <aside className="section-rail" aria-hidden="true"><strong>01</strong><span>Manifesto</span></aside>
      <div className="manifesto__title">
        <h2>Rebellion<br /><em>becomes</em> reconstruction<span>.</span></h2>
      </div>
      <div className="manifesto__copy">
        <p>Europe was designed for another era. AORB exists to redesign its political structure through peaceful democratic participation, public experimentation and measurable reform.</p>
        <blockquote>We are not rebelling against Europe. We are rebelling for the Europe that has not yet been built.</blockquote>
      </div>
      <figure className="manifesto__media">
        <img src="/assets/manifesto-plaza.webp" width="1536" height="1024" loading="lazy" decoding="async" alt="Historic and contemporary European civic buildings facing a violet light monument across a rain-soaked plaza" />
      </figure>
    </section>
  )
}

function Commitments() {
  const [active, setActive] = useState(0)
  return (
    <section className="commitments" id="commitments">
      <div className="orb" aria-hidden="true"><div className="orbit">✦　✦　✦　✦　✦</div></div>
      <div className="commitments__heading">
        <span>02 / Direction</span>
        <h2>Ten commitments<span>.</span></h2>
        <p>A political contract for the generation inheriting Europe — designed to be understood, measured and improved in public.</p>
      </div>
      <div className="commitment-list">
        {commitments.map(([title, body], index) => (
          <button
            type="button"
            className={active === index ? 'commitment commitment--active' : 'commitment'}
            key={title}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            aria-expanded={active === index}
          >
            <span className="commitment__number">{String(index + 1).padStart(2, '0')}</span>
            <span className="commitment__text"><strong>{title}</strong><span>{body}</span></span>
            <ArrowRight aria-hidden="true" size={22} strokeWidth={1.4} />
          </button>
        ))}
      </div>
    </section>
  )
}

function Method() {
  return (
    <section className="method" id="method">
      <div className="method__image" aria-hidden="true" />
      <div className="method__intro">
        <h2>Peaceful<span>.</span><br />Democratic<span>.</span><br />Measurable<span>.</span></h2>
        <p>We will publish evidence, measure results and revise policies that fail.</p>
      </div>
      <div className="method__rail">
        {methods.map(([number, title, body]) => (
          <div className="method-step" key={number}>
            <span>{number}</span>
            <div><strong>{title}</strong><p>{body}</p></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Closing() {
  const [copied, setCopied] = useState(false)
  const copySite = async () => {
    await navigator.clipboard?.writeText('aorb.eu')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  return (
    <section className="closing" id="contact">
      <div className="closing__mark" aria-hidden="true">A</div>
      <h2>Build the Europe<br />that does not yet exist<span>.</span></h2>
      <div className="closing__actions">
        <ArrowLink href="/AORB_Brand_Identity_and_Manifesto.pdf" download>Read the founding document</ArrowLink>
        <button className="action action--dark" type="button" onClick={copySite}>
          <span>{copied ? 'aorb.eu copied' : 'Copy aorb.eu'}</span><ExternalLink size={18} strokeWidth={1.7} />
        </button>
      </div>
      <footer>
        <Logo />
        <p>Alliance of Rebels Europe</p>
        <a href="https://aorb.eu">aorb.eu</a>
      </footer>
    </section>
  )
}

function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const value = max > 0 ? window.scrollY / max : 0
      ref.current?.style.setProperty('--progress', value)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return <div className="progress" ref={ref} aria-hidden="true" />
}

export default function App() {
  return (
    <>
      <ScrollProgress />
      <main>
        <Hero />
        <Manifesto />
        <Commitments />
        <Method />
        <Closing />
      </main>
    </>
  )
}
