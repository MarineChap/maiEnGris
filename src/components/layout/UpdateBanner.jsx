import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import '../../styles/UpdateBanner.css'

const CURRENT_VERSION = 'v2'

export default function UpdateBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('app_version')
    if (!stored) {
      // Première visite : on stocke silencieusement
      localStorage.setItem('app_version', CURRENT_VERSION)
    } else if (stored !== CURRENT_VERSION) {
      // Utilisateur revenant avec une ancienne version
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem('app_version', CURRENT_VERSION)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="update-banner"
          initial={{ opacity: 0, y: -32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -32 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        >
          <span className="update-banner__icon">✨</span>
          <p className="update-banner__text">
            <strong>Nouveauté —</strong> Vous pouvez maintenant ajouter une photo et le dénivelé à vos balades&nbsp;!
          </p>
          <button
            className="update-banner__close"
            onClick={dismiss}
            aria-label="Fermer"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
