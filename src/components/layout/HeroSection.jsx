import '../../styles/layout.css'

export default function HeroSection({ onDonate, onAddKm }) {
  function handleDonate() {
    if (typeof onDonate === 'string' && onDonate) window.open(onDonate, '_blank', 'noopener')
  }

  function handleAddKm() {
    if (typeof onAddKm === 'string' && onAddKm) window.open(onAddKm, '_blank', 'noopener')
    else onAddKm?.()
  }

  return (
    <section className="hero-wrapper">

      <div className="hero-split">

        {/* ── Left: white — Dominique, the project ── */}
        <div className="hero-split__content">
          <div className="hero__portrait-frame">
            <img
              src="/dom_chaput.jpeg"
              alt="Dominique Chaput — coureur de trail"
              className="hero__portrait"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>

          <div className="hero-dom">
            <h1 className="hero__title">La Route de ses courses</h1>
            <p className="hero__subtitle">Hommage à Dominique Chaput</p>
            <p className="hero__intro">
              Dominique était un coureur de trail passionné — 32 courses, des Alpes à la Martinique,
              de la Sainté Lyon à l'UTMB. Chaque kilomètre que vous courez ce mai fait revivre une
              étape de son parcours et finance la recherche contre le glioblastome.
            </p>
            <p className="hero__hint">
              Cliquez sur chaque étape du chemin pour découvrir son histoire.
            </p>
            <button className="hero-dom__cta" onClick={handleAddKm}>
              + Ajouter mes km
            </button>
          </div>
        </div>

        {/* ── Right: navy — glioblastoma, Mai en Gris, association ── */}
        <div className="hero-split__aside">
          <div className="hero-assoc">
            <p className="hero-assoc__tag">6ème édition · Mai 2026</p>
            <h2 className="hero-assoc__title">Mai en Gris</h2>
            <div className="hero-assoc__org-block">
              <p className="hero-assoc__org">Des Étoiles Dans La Mer</p>
            </div>
            <p className="hero-assoc__subtitle">Ensemble, luttons contre le glioblastome</p>

            <p className="hero-assoc__desc">
              Le glioblastome est une tumeur cérébrale agressive. Quand elle frappe,
              c'est toute la famille qui est touchée. En mai, nous portons le gris
              pour sensibiliser et financer la recherche.
            </p>

            <div className="hero-assoc__pillars">
              <span>🔬 Financer la recherche</span>
              <span>🤝 Soutenir les familles</span>
              <span>📢 Sensibiliser le public</span>
            </div>

            <div className="hero-assoc__donate-row">
              <div className="hero-assoc__tax">
                <p className="hero-assoc__tax-label">Après déduction fiscale (66 %)</p>
                <ul className="hero-assoc__tax-list">
                  <li><span>150 €</span> vous revient à <strong>51 €</strong></li>
                  <li><span>100 €</span> vous revient à <strong>34 €</strong></li>
                  <li><span>50 €</span> vous revient à <strong>17 €</strong></li>
                </ul>
              </div>

              <button className="assoc-btn assoc-btn--primary" onClick={handleDonate}>
                Faire un don →
              </button>
            </div>
          </div>
        </div>

      </div>


    </section>
  )
}
