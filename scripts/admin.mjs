/**
 * admin.mjs — Interface d'administration des courses
 *
 * Usage : node scripts/admin.mjs
 * Ouvre : http://localhost:3001
 */

import http     from 'http'
import fs       from 'fs'
import path     from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const ROOT       = path.dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, '')
const RACES_PATH = path.join(ROOT, 'src', 'data', 'races.json')
const PHOTOS_DIR = path.join(ROOT, 'public', 'photos')

fs.mkdirSync(PHOTOS_DIR, { recursive: true })

// ── Helpers ────────────────────────────────────────────────────────────────────

function readRaces() {
  return JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
}

function writeRaces(data) {
  fs.writeFileSync(RACES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
    req.on('error', reject)
  })
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// ── HTML ───────────────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin — Courses</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f7f6f3;
    --surface:  #ffffff;
    --border:   #e4e2dc;
    --border2:  #d0cdc4;
    --text:     #1a1916;
    --muted:    #7a786f;
    --accent:   #2d6a4f;
    --accent-l: #e8f4ee;
    --accent-d: #1b4332;
    --danger:   #c0392b;
    --warn:     #e67e22;
    --mono:     'DM Mono', monospace;
    --sans:     'DM Sans', sans-serif;
    --radius:   6px;
  }

  html { font-family: var(--sans); background: var(--bg); color: var(--text); font-size: 14px; }

  /* ── Layout ── */
  .app { max-width: 1100px; margin: 0 auto; padding: 0 24px 80px; }

  header {
    display: flex; align-items: center; gap: 16px;
    padding: 28px 0 24px;
    border-bottom: 2px solid var(--text);
    margin-bottom: 28px;
  }
  header h1 {
    font-family: var(--mono); font-size: 18px; font-weight: 500;
    letter-spacing: -0.02em; flex: 1;
  }
  header h1 span { color: var(--accent); }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: var(--radius);
    font-family: var(--sans); font-size: 13px; font-weight: 500;
    cursor: pointer; border: 1.5px solid transparent;
    transition: background .15s, color .15s, border-color .15s;
    white-space: nowrap;
  }
  .btn-primary { background: var(--text); color: #fff; border-color: var(--text); }
  .btn-primary:hover { background: #333; }
  .btn-accent  { background: var(--accent); color: #fff; border-color: var(--accent); }
  .btn-accent:hover  { background: var(--accent-d); }
  .btn-ghost   { background: transparent; color: var(--text); border-color: var(--border2); }
  .btn-ghost:hover { background: var(--bg); border-color: var(--text); }
  .btn-danger  { background: transparent; color: var(--danger); border-color: var(--danger); }
  .btn-danger:hover { background: var(--danger); color: #fff; }
  .btn-sm { padding: 4px 10px; font-size: 12px; }
  .btn:disabled { opacity: .45; cursor: default; }

  /* ── Table ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left; padding: 8px 10px;
    font-family: var(--mono); font-size: 11px; font-weight: 500;
    color: var(--muted); letter-spacing: .06em; text-transform: uppercase;
    border-bottom: 1.5px solid var(--border);
    background: var(--bg);
    white-space: nowrap;
  }
  tbody tr { border-bottom: 1px solid var(--border); }
  tbody tr:hover > td { background: #faf9f6; }
  tbody tr.editing > td { background: var(--accent-l) !important; }
  td { padding: 9px 10px; vertical-align: middle; }
  .td-date  { font-family: var(--mono); font-size: 12px; color: var(--muted); white-space: nowrap; }
  .td-name  { font-weight: 500; }
  .td-num   { font-family: var(--mono); font-size: 12px; text-align: right; }
  .td-badge { text-align: center; }
  .td-muted { color: var(--muted); font-size: 12px; max-width: 220px;
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .badge-gps { display:inline-block; font-size:12px; }
  .badge-gps.yes { color: var(--accent); }
  .badge-gps.no  { color: var(--border2); }

  /* ── Edit drawer ── */
  .edit-row td { padding: 0; }
  .edit-panel {
    padding: 24px 28px; background: var(--surface);
    border-top: 2px solid var(--accent);
    border-bottom: 2px solid var(--border);
  }
  .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
  .edit-full  { grid-column: 1 / -1; }

  .field label {
    display: block; font-family: var(--mono); font-size: 11px;
    font-weight: 500; color: var(--muted); letter-spacing: .06em;
    text-transform: uppercase; margin-bottom: 5px;
  }
  .field input, .field textarea, .field select {
    width: 100%; padding: 8px 10px; border: 1.5px solid var(--border2);
    border-radius: var(--radius); font-family: var(--sans); font-size: 13px;
    background: var(--bg); color: var(--text);
    transition: border-color .15s;
    outline: none;
  }
  .field input:focus, .field textarea:focus { border-color: var(--accent); }
  .field textarea { resize: vertical; min-height: 80px; }

  .edit-actions { display: flex; gap: 10px; margin-top: 20px; }

  /* ── Photos ── */
  .photos-label {
    font-family: var(--mono); font-size: 11px; font-weight: 500;
    color: var(--muted); letter-spacing: .06em; text-transform: uppercase;
    margin-bottom: 8px;
  }
  .photos-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
  .photo-item {
    position: relative; width: 80px; height: 80px;
    border-radius: 4px; overflow: hidden;
    border: 1.5px solid var(--border2);
  }
  .photo-item img {
    width: 100%; height: 100%; object-fit: cover;
    display: block;
  }
  .photo-delete {
    position: absolute; top: 2px; right: 2px;
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(0,0,0,.65); color: #fff;
    border: none; cursor: pointer; font-size: 10px;
    display: flex; align-items: center; justify-content: center;
    line-height: 1;
  }
  .photo-delete:hover { background: var(--danger); }
  .photo-placeholder {
    width: 80px; height: 80px; border-radius: 4px;
    border: 1.5px dashed var(--border2);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); font-size: 22px; cursor: pointer;
  }
  .photo-placeholder:hover { border-color: var(--accent); color: var(--accent); }
  #photo-file-input { display: none; }

  /* ── Modal ── */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.35);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; opacity: 0; pointer-events: none;
    transition: opacity .2s;
  }
  .overlay.open { opacity: 1; pointer-events: all; }
  .modal {
    background: var(--surface); border-radius: 10px;
    padding: 28px 32px; width: 480px; max-width: 95vw;
    box-shadow: 0 8px 40px rgba(0,0,0,.18);
    transform: translateY(12px); transition: transform .2s;
  }
  .overlay.open .modal { transform: translateY(0); }
  .modal h2 { font-family: var(--mono); font-size: 15px; font-weight: 500; margin-bottom: 20px; }
  .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; }
  .modal-full { grid-column: 1 / -1; }
  .modal-actions { display: flex; gap: 10px; margin-top: 22px; justify-content: flex-end; }

  /* ── Sync panel ── */
  .sync-modal .modal { width: 600px; }
  .log-area {
    margin-top: 14px; background: #1a1916; color: #c8e6c9;
    font-family: var(--mono); font-size: 12px; line-height: 1.7;
    padding: 14px 16px; border-radius: var(--radius);
    height: 240px; overflow-y: auto; white-space: pre-wrap;
    display: none;
  }
  .log-area.visible { display: block; }
  .log-line.err { color: #ef9a9a; }
  .spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
    border-radius: 50%; animation: spin .7s linear infinite;
    vertical-align: middle; margin-right: 6px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Toast ── */
  #toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--text); color: #fff;
    padding: 10px 18px; border-radius: var(--radius);
    font-size: 13px; font-family: var(--sans);
    box-shadow: 0 4px 20px rgba(0,0,0,.2);
    transform: translateY(16px); opacity: 0;
    transition: transform .25s, opacity .25s;
    pointer-events: none; z-index: 200;
  }
  #toast.show { transform: translateY(0); opacity: 1; }
  #toast.ok  { background: var(--accent); }
  #toast.err { background: var(--danger); }

  /* ── Stats bar ── */
  .stats {
    display: flex; gap: 28px; margin-bottom: 20px;
    padding: 14px 18px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius);
  }
  .stat-item { text-align: center; }
  .stat-val { font-family: var(--mono); font-size: 22px; font-weight: 500; color: var(--accent); }
  .stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }

  .toolbar { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; }
  .search {
    flex: 1; padding: 8px 12px; border: 1.5px solid var(--border2);
    border-radius: var(--radius); font-family: var(--sans); font-size: 13px;
    background: var(--surface); outline: none;
    transition: border-color .15s;
  }
  .search:focus { border-color: var(--accent); }
</style>
</head>
<body>
<div class="app">

  <header>
    <h1>Admin <span>— Courses</span></h1>
    <button class="btn btn-ghost" onclick="openSync()">⟳ Sync Strava</button>
    <button class="btn btn-primary" onclick="openAdd()">+ Nouvelle course</button>
  </header>

  <div class="stats" id="stats"></div>

  <div class="toolbar">
    <input class="search" type="text" placeholder="Rechercher une course…" oninput="filterTable(this.value)">
  </div>

  <div class="table-wrap">
    <table id="races-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Nom</th>
          <th style="text-align:right">Km</th>
          <th style="text-align:right">D+</th>
          <th style="text-align:center">GPS</th>
          <th style="text-align:center">Photos</th>
          <th>Anecdote</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
</div>

<!-- Add modal -->
<div class="overlay" id="add-overlay" onclick="closeAdd(event)">
  <div class="modal">
    <h2>Nouvelle course</h2>
    <div class="modal-grid">
      <div class="field modal-full">
        <label>Date</label>
        <input type="date" id="add-date">
      </div>
      <div class="field modal-full">
        <label>Nom</label>
        <input type="text" id="add-name" placeholder="Trail des Coursières">
      </div>
      <div class="field">
        <label>Distance (km)</label>
        <input type="number" id="add-dist" placeholder="50">
      </div>
      <div class="field">
        <label>Dénivelé (m+)</label>
        <input type="number" id="add-elev" placeholder="3000">
      </div>
      <div class="field modal-full">
        <label>URL</label>
        <input type="url" id="add-url" placeholder="https://…">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeAdd()">Annuler</button>
      <button class="btn btn-primary" onclick="submitAdd()">Ajouter</button>
    </div>
  </div>
</div>

<!-- Sync modal -->
<div class="overlay sync-modal" id="sync-overlay" onclick="closeSync(event)">
  <div class="modal">
    <h2>Synchronisation Strava / Suunto</h2>
    <div class="field">
      <label>Dossier export Suunto</label>
      <input type="text" id="sync-dir" value="./chaputdominique" placeholder="./chaputdominique">
    </div>
    <div style="margin-top:14px; display:flex; gap:10px; align-items:center">
      <button class="btn btn-accent" id="sync-btn" onclick="runSync()">Lancer la sync</button>
      <button class="btn btn-ghost" onclick="closeSync()">Fermer</button>
    </div>
    <div class="log-area" id="sync-log"></div>
  </div>
</div>

<!-- Hidden file input for photos -->
<input type="file" id="photo-file-input" accept="image/*" multiple onchange="handlePhotoUpload(this)">

<div id="toast"></div>

<script>
let races = {}
let editingDate = null
let editingPhotos = []

// ── Init ────────────────────────────────────────────────────────────────────

async function load() {
  const res = await fetch('/api/races')
  races = await res.json()
  renderStats()
  renderTable()
}

// ── Stats ───────────────────────────────────────────────────────────────────

function renderStats() {
  const list = Object.values(races)
  const totalKm = list.reduce((s, r) => s + (r.officialDistanceKm || 0), 0)
  const totalD  = list.reduce((s, r) => s + (r.officialElevGain_m || 0), 0)
  const withGps = list.filter(r => r.gpxPath).length
  document.getElementById('stats').innerHTML = \`
    <div class="stat-item"><div class="stat-val">\${list.length}</div><div class="stat-lbl">courses</div></div>
    <div class="stat-item"><div class="stat-val">\${totalKm.toLocaleString('fr')} km</div><div class="stat-lbl">distance totale</div></div>
    <div class="stat-item"><div class="stat-val">\${(totalD/1000).toFixed(0)} 000 m+</div><div class="stat-lbl">dénivelé cumulé</div></div>
    <div class="stat-item"><div class="stat-val">\${withGps}</div><div class="stat-lbl">traces GPS</div></div>
  \`
}

// ── Table ───────────────────────────────────────────────────────────────────

let filterVal = ''
function filterTable(v) { filterVal = v.toLowerCase(); renderTable() }

function renderTable() {
  const tbody = document.getElementById('tbody')
  const sorted = Object.values(races).sort((a,b) => b.date.localeCompare(a.date))
  const filtered = filterVal
    ? sorted.filter(r => r.name.toLowerCase().includes(filterVal) || r.date.includes(filterVal))
    : sorted

  tbody.innerHTML = ''
  for (const r of filtered) {
    const isEditing = editingDate === r.date
    const tr = document.createElement('tr')
    tr.id = 'row-' + r.date
    if (isEditing) tr.classList.add('editing')
    tr.innerHTML = \`
      <td class="td-date">\${r.date}</td>
      <td class="td-name">\${r.name}</td>
      <td class="td-num">\${r.officialDistanceKm ?? '—'}</td>
      <td class="td-num">\${r.officialElevGain_m ? r.officialElevGain_m.toLocaleString('fr') : '—'}</td>
      <td class="td-badge"><span class="badge-gps \${r.gpxPath ? 'yes' : 'no'}">\${r.gpxPath ? '✓' : '–'}</span></td>
      <td class="td-badge" style="color:var(--muted); font-family:var(--mono); font-size:12px">\${r.photos?.length || 0}</td>
      <td class="td-muted">\${r.anecdote ? r.anecdote.slice(0,50) + (r.anecdote.length > 50 ? '…' : '') : '<span style="color:var(--border2)">—</span>'}</td>
      <td style="text-align:right; white-space:nowrap">
        <button class="btn btn-ghost btn-sm" onclick="toggleEdit('\${r.date}')">\${isEditing ? '✕ Fermer' : 'Éditer'}</button>
      </td>
    \`
    tbody.appendChild(tr)

    if (isEditing) {
      const editTr = document.createElement('tr')
      editTr.className = 'edit-row'
      editTr.id = 'edit-' + r.date
      editTr.innerHTML = \`<td colspan="8"><div class="edit-panel">\${editPanelHTML(r)}</div></td>\`
      tbody.appendChild(editTr)
    }
  }
}

function editPanelHTML(r) {
  const photosHTML = (r.photos || []).map((p, i) => \`
    <div class="photo-item" id="photo-\${i}">
      <img src="http://localhost:5173\${p}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><rect width=%2280%22 height=%2280%22 fill=%22%23e4e2dc%22/><text x=%2240%22 y=%2244%22 text-anchor=%22middle%22 fill=%22%237a786f%22 font-size=%2211%22>img</text></svg>'">
      <button class="photo-delete" onclick="removePhoto(\${i})" title="Supprimer">✕</button>
    </div>
  \`).join('')

  const gpsInfo = r.gpxPath ? \`
    <div style="background:var(--accent-l); border-radius:4px; padding:10px 12px; font-size:12px; font-family:var(--mono); color:var(--accent-d)">
      ✓ GPS &nbsp;·&nbsp; \${r.distanceKm} km &nbsp;·&nbsp; \${r.duration || '—'} &nbsp;·&nbsp; +\${r.elevGain_m} m &nbsp;\${r.avgHeartRate ? '· ❤ ' + r.avgHeartRate + ' bpm' : ''}
    </div>
  \` : ''

  const manualGps = !r.gpxPath ? \`
    <div style="margin-top:4px; padding-top:16px; border-top:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px">
        Données manuelles (pas de trace GPS)
      </div>
      <div class="edit-grid">
        <div class="field">
          <label>Durée (ex: 13 h 49 min)</label>
          <input type="text" id="e-duration" placeholder="13 h 49 min" value="\${esc(r.duration || '')}">
        </div>
        <div class="field">
          <label>Heure de départ</label>
          <input type="datetime-local" id="e-starttime" value="\${r.startTime ? r.startTime.slice(0,16) : ''}">
        </div>
        <div class="field">
          <label>Distance GPS (km)</label>
          <input type="number" step="0.1" id="e-gpsdist" placeholder="79.6" value="\${r.distanceKm || ''}">
        </div>
        <div class="field">
          <label>Dénivelé GPS (m+)</label>
          <input type="number" id="e-gpselev" placeholder="3843" value="\${r.elevGain_m || ''}">
        </div>
        <div class="field">
          <label>FC moyenne (bpm)</label>
          <input type="number" id="e-hr" placeholder="145" value="\${r.avgHeartRate || ''}">
        </div>
      </div>
    </div>
  \` : ''

  return \`
    \${gpsInfo ? '<div style="margin-bottom:16px">' + gpsInfo + '</div>' : ''}
    <div class="edit-grid">
      <div class="field">
        <label>Nom</label>
        <input type="text" id="e-name" value="\${esc(r.name)}">
      </div>
      <div class="field">
        <label>URL</label>
        <input type="url" id="e-url" value="\${esc(r.url || '')}">
      </div>
      <div class="field">
        <label>Distance officielle (km)</label>
        <input type="number" id="e-dist" value="\${r.officialDistanceKm || ''}">
      </div>
      <div class="field">
        <label>Dénivelé officiel (m+)</label>
        <input type="number" id="e-elev" value="\${r.officialElevGain_m || ''}">
      </div>
      <div class="field edit-full">
        <label>Anecdote</label>
        <textarea id="e-anecdote">\${esc(r.anecdote || '')}</textarea>
      </div>
    </div>
    \${manualGps}

    <div style="margin-top:16px">
      <div class="photos-label">Photos</div>
      <div class="photos-grid" id="photos-grid">
        \${photosHTML}
        <div class="photo-placeholder" onclick="document.getElementById('photo-file-input').click()" title="Ajouter une photo">+</div>
      </div>
    </div>

    <div class="edit-actions">
      <button class="btn btn-primary" onclick="saveEdit('\${r.date}')">Enregistrer</button>
      <button class="btn btn-ghost" onclick="toggleEdit('\${r.date}')">Annuler</button>
      <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="deleteRace('\${r.date}')">Supprimer</button>
    </div>
  \`
}

function esc(s) {
  return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Edit ─────────────────────────────────────────────────────────────────────

function toggleEdit(date) {
  if (editingDate === date) {
    editingDate = null
    editingPhotos = []
  } else {
    editingDate = date
    editingPhotos = [...(races[date].photos || [])]
  }
  renderTable()
  if (editingDate) {
    document.getElementById('edit-' + date)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

async function saveEdit(date) {
  const payload = {
    name:               document.getElementById('e-name').value.trim(),
    url:                document.getElementById('e-url').value.trim() || null,
    officialDistanceKm: parseInt(document.getElementById('e-dist').value) || null,
    officialElevGain_m: parseInt(document.getElementById('e-elev').value) || null,
    anecdote:           document.getElementById('e-anecdote').value.trim() || null,
    photos:             editingPhotos,
  }
  // Champs manuels (seulement si pas de trace GPS)
  const dur = document.getElementById('e-duration')
  if (dur) {
    const st = document.getElementById('e-starttime').value
    payload.duration     = dur.value.trim() || null
    payload.startTime    = st ? new Date(st).toISOString() : null
    payload.distanceKm   = parseFloat(document.getElementById('e-gpsdist').value) || null
    payload.elevGain_m   = parseInt(document.getElementById('e-gpselev').value) || null
    payload.avgHeartRate = parseInt(document.getElementById('e-hr').value) || null
  }
  const res = await fetch('/api/races/' + date, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  if (res.ok) {
    races[date] = { ...races[date], ...payload }
    editingDate = null; editingPhotos = []
    renderStats(); renderTable()
    toast('Enregistré ✓', 'ok')
  } else {
    toast("Erreur lors de l'enregistrement", 'err')
  }
}

async function deleteRace(date) {
  if (!confirm('Supprimer "' + races[date].name + '" ?')) return
  const res = await fetch('/api/races/' + date, { method: 'DELETE' })
  if (res.ok) {
    delete races[date]
    editingDate = null; editingPhotos = []
    renderStats(); renderTable()
    toast('Course supprimée', 'ok')
  }
}

// ── Photos ────────────────────────────────────────────────────────────────────

function removePhoto(idx) {
  editingPhotos.splice(idx, 1)
  rerenderPhotos()
}

function rerenderPhotos() {
  const grid = document.getElementById('photos-grid')
  if (!grid) return
  const photosHTML = editingPhotos.map((p, i) => \`
    <div class="photo-item">
      <img src="http://localhost:5173\${p}" onerror="this.style.background='#e4e2dc'">
      <button class="photo-delete" onclick="removePhoto(\${i})">✕</button>
    </div>
  \`).join('')
  grid.innerHTML = photosHTML + \`<div class="photo-placeholder" onclick="document.getElementById('photo-file-input').click()" title="Ajouter">+</div>\`
}

async function handlePhotoUpload(input) {
  const files = Array.from(input.files)
  for (const file of files) {
    const data = await toBase64(file)
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ filename: file.name, data })
    })
    if (res.ok) {
      const { path: p } = await res.json()
      editingPhotos.push(p)
      rerenderPhotos()
    } else {
      toast('Erreur upload photo', 'err')
    }
  }
  input.value = ''
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// ── Add modal ─────────────────────────────────────────────────────────────────

function openAdd() { document.getElementById('add-overlay').classList.add('open') }
function closeAdd(e) {
  if (!e || e.target === document.getElementById('add-overlay'))
    document.getElementById('add-overlay').classList.remove('open')
}

async function submitAdd() {
  const date = document.getElementById('add-date').value
  const name = document.getElementById('add-name').value.trim()
  const dist = parseInt(document.getElementById('add-dist').value)
  const elev = parseInt(document.getElementById('add-elev').value)
  const url  = document.getElementById('add-url').value.trim()

  if (!date || !name || !dist) return toast('Date, nom et distance requis', 'err')
  if (races[date]) return toast('Une course existe déjà à cette date', 'err')

  const res = await fetch('/api/races', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ date, name, officialDistanceKm: dist, officialElevGain_m: elev || null, url: url || null })
  })
  if (res.ok) {
    const r = await res.json()
    races[r.date] = r
    closeAdd()
    renderStats(); renderTable()
    toast('Course ajoutée ✓', 'ok')
    ;['add-date','add-name','add-dist','add-elev','add-url'].forEach(id => document.getElementById(id).value = '')
  } else {
    toast("Erreur lors de l'ajout", 'err')
  }
}

// ── Sync modal ────────────────────────────────────────────────────────────────

function openSync() { document.getElementById('sync-overlay').classList.add('open') }
function closeSync(e) {
  if (!e || e.target === document.getElementById('sync-overlay'))
    document.getElementById('sync-overlay').classList.remove('open')
}

async function runSync() {
  const suuntoDir = document.getElementById('sync-dir').value.trim()
  if (!suuntoDir) return toast('Chemin du dossier requis', 'err')

  const btn = document.getElementById('sync-btn')
  const log = document.getElementById('sync-log')
  btn.disabled = true
  btn.innerHTML = '<span class="spinner"></span> En cours…'
  log.innerHTML = ''
  log.classList.add('visible')

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ suuntoDir })
    })
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\\n')
      buf = lines.pop()
      for (const l of lines) {
        if (!l.trim()) continue
        try {
          const obj = JSON.parse(l)
          if (obj.done) {
            log.innerHTML += '<span style="color:#a5d6a7">\\n✓ Terminé</span>\\n'
            await load()
          } else {
            const cls = obj.error ? 'err' : ''
            const txt = obj.line || obj.error || ''
            log.innerHTML += \`<span class="log-line \${cls}">\${txt}\\n</span>\`
          }
        } catch {}
        log.scrollTop = log.scrollHeight
      }
    }
  } catch(err) {
    log.innerHTML += '<span class="log-line err">Erreur réseau: ' + err.message + '</span>\\n'
  }

  btn.disabled = false
  btn.innerHTML = '⟳ Relancer'
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function toast(msg, type = '') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = 'show ' + type
  clearTimeout(el._t)
  el._t = setTimeout(() => el.className = '', 2800)
}

// ── Boot ──────────────────────────────────────────────────────────────────────
load()
</script>
</body>
</html>`

// ── Server ─────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url    = new URL(req.url, 'http://localhost')
  const method = req.method
  const p      = url.pathname

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (method === 'OPTIONS') { res.writeHead(204); return res.end() }

  // ── Static HTML
  if (method === 'GET' && p === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(HTML)
  }

  // ── GET /api/races
  if (method === 'GET' && p === '/api/races') {
    return json(res, readRaces())
  }

  // ── POST /api/races
  if (method === 'POST' && p === '/api/races') {
    const { date, name, officialDistanceKm, officialElevGain_m, url: rUrl } = await body(req)
    if (!date || !name) return json(res, { error: 'date et nom requis' }, 400)
    const data = readRaces()
    if (data[date]) return json(res, { error: 'date déjà existante' }, 409)
    const entry = {
      date, name,
      officialDistanceKm: officialDistanceKm || null,
      officialElevGain_m: officialElevGain_m || null,
      url: rUrl || null,
      anecdote: null,
      photos: [],
      gpxFile: null, gpxPath: null, tracePartial: null,
      distanceKm: null, duration: null, durationSec: null,
      elevGain_m: null, avgHeartRate: null, startTime: null, elevationSamples: null,
    }
    data[date] = entry
    writeRaces(data)
    return json(res, entry, 201)
  }

  // ── PATCH /api/races/:date
  const patchMatch = p.match(/^\/api\/races\/(\d{4}-\d{2}-\d{2})$/)
  if (method === 'PATCH' && patchMatch) {
    const date   = patchMatch[1]
    const data   = readRaces()
    if (!data[date]) return json(res, { error: 'not found' }, 404)
    const fields = await body(req)
    const allowed = ['name','url','anecdote','photos','officialDistanceKm','officialElevGain_m',
                     'duration','startTime','distanceKm','elevGain_m','avgHeartRate']
    for (const k of allowed) if (k in fields) data[date][k] = fields[k]
    writeRaces(data)
    return json(res, data[date])
  }

  // ── DELETE /api/races/:date
  const delMatch = p.match(/^\/api\/races\/(\d{4}-\d{2}-\d{2})$/)
  if (method === 'DELETE' && delMatch) {
    const date = delMatch[1]
    const data = readRaces()
    if (!data[date]) return json(res, { error: 'not found' }, 404)
    delete data[date]
    writeRaces(data)
    return json(res, { ok: true })
  }

  // ── POST /api/photos
  if (method === 'POST' && p === '/api/photos') {
    const { filename, data: b64 } = await body(req)
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const dest = path.join(PHOTOS_DIR, safe)
    fs.writeFileSync(dest, Buffer.from(b64, 'base64'))
    return json(res, { path: '/photos/' + safe })
  }

  // ── POST /api/sync  (streaming)
  if (method === 'POST' && p === '/api/sync') {
    const { suuntoDir } = await body(req)
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' })

    const send = obj => res.write(JSON.stringify(obj) + '\n')

    const run = (args) => new Promise(resolve => {
      const child = spawn('node', args, { cwd: ROOT })
      child.stdout.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => send({ line: l })))
      child.stderr.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => send({ line: l })))
      child.on('close', resolve)
    })

    await run(['scripts/strava-import.mjs', suuntoDir])
    await run(['scripts/generate-elevations.mjs'])
    send({ done: true })
    return res.end()
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(3001, () => {
  console.log('\n🏔  Admin — Courses')
  console.log('   http://localhost:3001\n')
})
