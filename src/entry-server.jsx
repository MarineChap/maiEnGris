import { renderToString } from 'react-dom/server'
import App from './App.jsx'

export function render() {
  try {
    return renderToString(<App />)
  } catch {
    return ''
  }
}
