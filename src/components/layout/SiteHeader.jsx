import '../../styles/layout.css'
import { ASSOCIATION_URL } from '../../data/races'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="site-header__name">Mai en Gris</span>
        <span className="site-header__tagline">
          En souvenir de<br className="site-header__tagline-br" /> Dominique Chaput
        </span>
      </div>
      <div className="site-header__right">
        <span className="site-header__blurb">Défi sportif au profit de</span>
        <a
          className="site-header__link"
          href={ASSOCIATION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Des Étoiles Dans La Mer →
        </a>
      </div>
    </header>
  )
}
