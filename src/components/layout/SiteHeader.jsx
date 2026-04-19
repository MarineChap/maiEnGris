import '../../styles/layout.css'
import { ASSOCIATION_URL } from '../../data/races'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="site-header__name">Des Étoiles Dans La Mer</span>
        <span className="site-header__tagline">Vaincre Le Glioblastome</span>
      </div>
      <a
        className="site-header__link"
        href={ASSOCIATION_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        → Site de l'association
      </a>
    </header>
  )
}
