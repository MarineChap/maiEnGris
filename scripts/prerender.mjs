import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const distIndex = path.join(root, 'dist', 'index.html')
const serverEntry = path.join(root, 'dist-ssr', 'entry-server.js')

const template = fs.readFileSync(distIndex, 'utf-8')

try {
  const { render } = await import(serverEntry)
  const appHtml = render()
  if (appHtml) {
    const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
    fs.writeFileSync(distIndex, html)
    console.log('Prérendu SEO appliqué avec succès.')
  } else {
    console.warn('Prérendu vide — le site fonctionnera quand même sans prérendu.')
  }
} catch (err) {
  console.warn('Prérendu échoué (le site fonctionnera quand même) :', err.message)
}
