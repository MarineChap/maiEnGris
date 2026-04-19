import '../../styles/layout.css'
import { ASSOCIATION_URL } from '../../data/races'

const REASONS = [
  "Financer la recherche contre le glioblastome",
  "Soutenir les familles touchées par ce cancer",
  "Honorer la mémoire de ceux que nous avons perdus trop tôt",
]

export default function DonationSection() {
  return (
    <section className="donation-section">
      <div className="donation-section__inner">
        <div>
          <h2 className="donation-section__heading">Soutenir la Recherche</h2>
          <ul className="donation-section__list">
            {REASONS.map((reason, i) => (
              <li key={i}>
                <span className="donation-section__dot" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="donation-card">
          <h3 className="donation-card__title">Faire un Don</h3>
          <p className="donation-card__text">
            Chaque don, grand ou petit, contribue à la lutte contre le cancer du cerveau
            et permet à l'association de financer des projets de recherche essentiels.
          </p>
          <a
            className="donation-card__cta"
            href={ASSOCIATION_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Donner maintenant →
          </a>
          <a
            className="donation-card__link"
            href={ASSOCIATION_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            En savoir plus sur l'association →
          </a>
        </div>
      </div>
    </section>
  )
}
