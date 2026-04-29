"""
Génère public/training-data.json depuis les GPX de la montre de Dom.
Pour chaque course, extrait les entraînements outdoor des 6 semaines avant.
Le point de départ est géocodé inversement via Nominatim (cache local).
"""

import json
import os
import re
import math
import time
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from xml.etree import ElementTree as ET

WORKOUTS_DIR = os.path.join(os.path.dirname(__file__), '../chaputdominique/workouts')
RACES_JSON   = os.path.join(os.path.dirname(__file__), '../src/data/races.json')
OUTPUT       = os.path.join(os.path.dirname(__file__), '../public/training-data.json')
GEO_CACHE    = os.path.join(os.path.dirname(__file__), '.geo_cache.json')

OUTDOOR_TYPES = ['trail_running', 'hiking', 'walking', 'trekking', 'snow_shoeing', 'running']
MAX_POINTS    = 60
MIN_POINTS    = 10
WEEKS_BEFORE  = 6

NS = {'gpx': 'http://www.topografix.com/GPX/1/1'}

# ── Reverse geocoding ──────────────────────────────────────────────────────────

def load_geo_cache():
    if os.path.exists(GEO_CACHE):
        with open(GEO_CACHE) as f:
            return json.load(f)
    return {}

def save_geo_cache(cache):
    with open(GEO_CACHE, 'w') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def reverse_geocode(lat, lon, cache):
    # Arrondir à 2 décimales (~1km) comme clé de cache
    key = f'{round(lat, 2)},{round(lon, 2)}'
    if key in cache:
        return cache[key]

    url = (
        'https://nominatim.openstreetmap.org/reverse'
        f'?lat={lat}&lon={lon}&format=json&zoom=14&accept-language=fr'
    )
    req = urllib.request.Request(url, headers={'User-Agent': 'mai-en-gris/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())
        addr = data.get('address', {})
        village = (
            addr.get('village') or
            addr.get('town') or
            addr.get('city') or
            addr.get('municipality') or
            addr.get('county') or
            ''
        )
        time.sleep(1.1)  # Nominatim : max 1 req/sec
    except Exception:
        village = ''

    cache[key] = village
    save_geo_cache(cache)
    return village


# ── GPX parsing ────────────────────────────────────────────────────────────────

def parse_gpx(path):
    try:
        tree = ET.parse(path)
    except ET.ParseError:
        return None
    root = tree.getroot()

    desc_el = root.find('.//gpx:desc', NS)
    desc = desc_el.text.strip() if desc_el is not None and desc_el.text else ''

    trkpts = root.findall('.//gpx:trkpt', NS)
    if len(trkpts) < MIN_POINTS:
        return None

    coords = []
    for pt in trkpts:
        try:
            lat = float(pt.attrib['lat'])
            lon = float(pt.attrib['lon'])
            coords.append([round(lat, 4), round(lon, 4)])
        except (KeyError, ValueError):
            continue

    if len(coords) < MIN_POINTS:
        return None

    step = max(1, len(coords) // MAX_POINTS)
    simplified = coords[::step]
    if simplified[-1] != coords[-1]:
        simplified.append(coords[-1])

    def haversine(a, b):
        R = 6371
        lat1, lon1 = math.radians(a[0]), math.radians(a[1])
        lat2, lon2 = math.radians(b[0]), math.radians(b[1])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        x = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
        return R * 2 * math.asin(math.sqrt(x))

    distance_km = sum(haversine(coords[i], coords[i+1]) for i in range(len(coords)-1))

    return {
        'desc': desc,
        'polyline': simplified,
        'startLatLon': coords[0],
        'distanceKm': round(distance_km, 1),
    }


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    with open(RACES_JSON) as f:
        races = json.load(f)

    geo_cache = load_geo_cache()

    gpx_index = []
    for fn in sorted(os.listdir(WORKOUTS_DIR)):
        if not fn.endswith('.gpx'):
            continue
        activity_type = None
        for t in OUTDOOR_TYPES:
            if fn.endswith(f'-{t}.gpx') or f'-{t}.' in fn:
                activity_type = t
                break
        if not activity_type:
            continue
        m = re.match(r'(\d{4}-\d{2}-\d{2})', fn)
        if not m:
            continue
        try:
            date = datetime.strptime(m.group(1), '%Y-%m-%d')
        except ValueError:
            continue
        gpx_index.append((date, activity_type, fn))

    print(f'{len(gpx_index)} fichiers GPX outdoor indexés')

    result = {}
    total_geocoded = 0

    for race_key, race in races.items():
        try:
            race_date = datetime.strptime(race['date'], '%Y-%m-%d')
        except (KeyError, ValueError):
            continue

        window_start = race_date - timedelta(weeks=WEEKS_BEFORE)
        candidates = [
            (date, atype, fn)
            for date, atype, fn in gpx_index
            if window_start <= date < race_date
        ]
        if not candidates:
            continue

        trainings = []
        for date, atype, fn in candidates:
            path = os.path.join(WORKOUTS_DIR, fn)
            parsed = parse_gpx(path)
            if not parsed:
                continue

            lat, lon = parsed['startLatLon']
            key = f'{round(lat, 2)},{round(lon, 2)}'
            if key not in geo_cache:
                total_geocoded += 1
                print(f'  Géocodage {total_geocoded}: {lat},{lon}', end='\r')
            village = reverse_geocode(lat, lon, geo_cache)

            days_before = (race_date - date).days
            trainings.append({
                'date': date.strftime('%Y-%m-%d'),
                'daysBeforeRace': days_before,
                'type': atype,
                'description': parsed['desc'],
                'distanceKm': parsed['distanceKm'],
                'startVillage': village,
                'polyline': parsed['polyline'],
            })

        if trainings:
            trainings.sort(key=lambda x: x['daysBeforeRace'])
            result[race_key] = trainings
            print(f"  {race['name'][:40]:<40} {len(trainings)} tracés")

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))

    total = sum(len(v) for v in result.values())
    size_kb = os.path.getsize(OUTPUT) // 1024
    print(f'\n{len(result)} courses · {total} tracés → {OUTPUT} ({size_kb} KB)')
    if total_geocoded:
        print(f'{total_geocoded} nouvelles localisations géocodées')


if __name__ == '__main__':
    main()
