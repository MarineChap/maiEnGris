import '../../styles/layout.css'
import { DONATION_URL } from '../../data/races'

export default function HeroSection() {
  return (
    <section className="hero-wrapper">

      <div className="hero-split">

        {/* ── Left: white — Mai en Gris, association ── */}
        <div className="hero-split__content">
          <div className="hero-assoc">
            <p className="hero-assoc__tag">6ème édition · Mai 2026</p>
            <h2 className="hero-assoc__title">Mai en Gris</h2>
            <div className="hero-assoc__org-block">
              <p className="hero-assoc__org">Des Étoiles Dans La Mer</p>
            </div>
            <p className="hero-assoc__subtitle">Financer la recherche</p>

            <p className="hero-assoc__desc">
              Le glioblastome ne se vaincra que par la science. Votre don finance directement
              les chercheurs qui travaillent chaque jour pour offrir un futur aux malades et
              à leurs familles. <strong>C'est là que se gagne le vrai combat.</strong>
            </p>

            <div className="hero-assoc__tax">
              <p className="hero-assoc__tax-label">Après déduction fiscale (66 %)</p>
              <ul className="hero-assoc__tax-list">
                <li><span>150 €</span> vous revient à <strong>51 €</strong></li>
                <li><span>100 €</span> vous revient à <strong>34 €</strong></li>
                <li><span>50 €</span> vous revient à <strong>17 €</strong></li>
              </ul>
            </div>

            <a
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-assoc__donate-mobile"
            >
              Faire un don →
            </a>
          </div>
        </div>

        {/* ── Right: navy — Dominique, the project ── */}
        <div className="hero-split__aside">
          <div className="hero-dom">
            <h1 className="hero__title">Sur la trace de ses courses</h1>
            <p className="hero__subtitle">En souvenir de Dominique Chaput</p>
            <p className="hero__intro">
              Dominique aimait se dépasser — des Alpes à la Martinique,
              de la Sainté Lyon à l'UTMB. Le défi : cumuler collectivement autant de kilomètres
              que les 49 plus grandes courses de sa vie. Que vous marchiez 2 km ou couriez un marathon,
              chaque pas s'ajoute au compteur commun.
            </p>
            <p className="hero__hint">
              Cliquez sur chaque étape du chemin pour découvrir son histoire.
            </p>
            <p className="hero__contribute">
              Vous avez des photos ou des anecdotes à partager ?{' '}
              <a href="mailto:marine@surlestracesdedom.fr">Contactez la famille Chaput</a>
              , on les ajoutera avec plaisir.
            </p>
          </div>

          <div className="hero__portrait-frame">
            <img
              src="/dom_chaput.jpeg"
              alt="Dominique Chaput, coureur de trail de Taluyers"
              className="hero__portrait"
              fetchPriority="high"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        </div>

      </div>

    </section>
  )
}
