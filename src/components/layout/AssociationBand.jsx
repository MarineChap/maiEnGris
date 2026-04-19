import '../../styles/layout.css'

export default function AssociationBand({ onDonate, onAddKm }) {
  function handleDonate() {
    if (typeof onDonate === 'string' && onDonate) window.open(onDonate, '_blank', 'noopener')
  }

  function handleAddKm() {
    if (typeof onAddKm === 'string' && onAddKm) window.open(onAddKm, '_blank', 'noopener')
    else onAddKm?.()
  }

  return (
    <section className="assoc-band">
      <div className="assoc-band__inner">
        <div className="assoc-band__text">
          <p className="assoc-band__org">Des Étoiles Dans La Mer — Vaincre Le Glioblastome</p>
          <p className="assoc-band__desc">
            Chaque kilomètre couru et chaque don financent directement la recherche contre le glioblastome.
            Rejoignez le mouvement — courez, contribuez, honorez sa mémoire.
          </p>
        </div>
        <div className="assoc-band__actions">
          <button className="assoc-btn assoc-btn--outline" onClick={handleAddKm}>
            + Ajouter mes km
          </button>
          <button className="assoc-btn assoc-btn--primary" onClick={handleDonate}>
            Faire un don →
          </button>
        </div>
      </div>
    </section>
  )
}
