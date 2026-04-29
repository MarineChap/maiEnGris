import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function FitBounds({ polyline }) {
  const map = useMap()
  useEffect(() => {
    if (!polyline || polyline.length < 2) return
    const bounds = L.latLngBounds(polyline.map(p => [p[0], p[1]]))
    map.fitBounds(bounds, { padding: [16, 16] })
  }, [map, polyline])
  return null
}

function pickCenter(polyline) {
  const mid = polyline[Math.floor(polyline.length / 2)]
  return [mid[0], mid[1]]
}

export default function RaceMap({ polyline }) {
  return (
    <MapContainer
      center={pickCenter(polyline)}
      zoom={12}
      scrollWheelZoom={true}
      dragging={true}
      zoomControl={true}
      attributionControl={false}
      className="race-map"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline
        positions={polyline}
        pathOptions={{ color: '#1D2B52', weight: 3, opacity: 0.85 }}
      />
      <FitBounds polyline={polyline} />
    </MapContainer>
  )
}
