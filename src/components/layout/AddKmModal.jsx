import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { addContribution } from '../../services/contributions'
import { DONATION_URL } from '../../data/races'
import '../../styles/AddKmModal.css'

export default function AddKmModal({ onClose, onSuccess }) {
  const [km, setKm] = useState('')
  const [prenom, setPrenom] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const kmNum = parseFloat(km)
    if (!kmNum || kmNum <= 0) {
      setError('Entrez un nombre de km valide.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const contribution = await addContribution({ prenom, km: kmNum, message })
      setSubmittedData({ km: kmNum, prenom: prenom.trim() || null })
      setSubmitted(true)
      onSuccess?.(contribution)
    } catch (err) {
      setError(err?.message ?? 'Une erreur est survenue. Réessayez dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="addkm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="addkm-modal"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        aria-label="Ajouter mes kilomètres"
      >
        <button className="addkm-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              className="addkm-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="addkm-success__icon">🏃</div>
              <h3 className="addkm-success__title">
                Merci{submittedData?.prenom ? ` ${submittedData.prenom}` : ''}&nbsp;!
              </h3>
              <p className="addkm-success__text">
                Vos <strong>{submittedData?.km} km</strong> ont été ajoutés au
                compteur collectif. Vous contribuez à honorer la mémoire de
                Dominique.
              </p>
              <p className="addkm-don-nudge addkm-don-nudge--success">
                Et si vous faisiez aussi un don à la recherche&nbsp;?{' '}
                <a href={DONATION_URL} target="_blank" rel="noopener noreferrer" className="addkm-don-link">
                  Faire un don →
                </a>
              </p>
              <button className="addkm-btn" onClick={onClose}>
                Fermer
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }}>
              <div className="addkm-header">
                <div className="addkm-header__icon">🏔️</div>
                <h2 className="addkm-header__title">Ajouter mes kilomètres</h2>
                <p className="addkm-header__sub">
                  Chaque km compte pour honorer le parcours de Dominique
                </p>
              </div>

              <form className="addkm-form" onSubmit={handleSubmit} noValidate>
                <div className="addkm-field">
                  <label className="addkm-label" htmlFor="addkm-km">
                    Mes kilomètres&nbsp;<span className="addkm-required">*</span>
                  </label>
                  <div className="addkm-km-row">
                    <input
                      id="addkm-km"
                      className="addkm-input addkm-input--km"
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="ex: 10"
                      value={km}
                      onChange={(e) => setKm(e.target.value)}
                      required
                      autoFocus
                    />
                    <span className="addkm-unit">km</span>
                  </div>
                </div>

                <div className="addkm-field">
                  <label className="addkm-label" htmlFor="addkm-prenom">
                    Prénom&nbsp;<span className="addkm-optional">optionnel</span>
                  </label>
                  <input
                    id="addkm-prenom"
                    className="addkm-input"
                    type="text"
                    maxLength={30}
                    placeholder="ex: Marie"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                  />
                </div>

                <div className="addkm-field">
                  <label className="addkm-label" htmlFor="addkm-message">
                    Un mot pour Dominique&nbsp;<span className="addkm-optional">optionnel</span>
                  </label>
                  <textarea
                    id="addkm-message"
                    className="addkm-input addkm-textarea"
                    maxLength={280}
                    rows={3}
                    placeholder="Un souvenir, une pensée…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <span className="addkm-char-count">{message.length}/280</span>
                </div>

                {error && <p className="addkm-error" role="alert">{error}</p>}

                <p className="addkm-don-nudge">
                  Chaque geste compte — pensez aussi au don pour soutenir la recherche.{' '}
                  <a href={DONATION_URL} target="_blank" rel="noopener noreferrer" className="addkm-don-link">
                    Faire un don →
                  </a>
                </p>

                <button className="addkm-btn" type="submit" disabled={loading}>
                  {loading ? 'Envoi…' : '+ Ajouter ces km'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  )
}
