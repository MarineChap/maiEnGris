"""
Extrait les polylines simplifiées depuis les GPX de course (public/gpx/)
et les injecte dans races.json sous la clé "polyline".
"""

import json
import os
import math
from xml.etree import ElementTree as ET

GPX_DIR    = os.path.join(os.path.dirname(__file__), '../public/gpx')
RACES_JSON = os.path.join(os.path.dirname(__file__), '../src/data/races.json')

MAX_POINTS = 80
NS = {'gpx': 'http://www.topografix.com/GPX/1/1'}


def parse_polyline(path):
    try:
        tree = ET.parse(path)
    except ET.ParseError:
        return None
    root = tree.getroot()

    trkpts = root.findall('.//gpx:trkpt', NS)
    if len(trkpts) < 2:
        return None

    coords = []
    for pt in trkpts:
        try:
            lat = float(pt.attrib['lat'])
            lon = float(pt.attrib['lon'])
            coords.append([round(lat, 4), round(lon, 4)])
        except (KeyError, ValueError):
            continue

    if len(coords) < 2:
        return None

    step = max(1, len(coords) // MAX_POINTS)
    simplified = coords[::step]
    if simplified[-1] != coords[-1]:
        simplified.append(coords[-1])

    return simplified


def main():
    with open(RACES_JSON, encoding='utf-8') as f:
        races = json.load(f)

    updated = 0
    for key, race in races.items():
        gpx_path = race.get('gpxPath')
        if not gpx_path:
            continue

        # gpxPath est de la forme /gpx/2022-06-18-trail_running.gpx
        local_path = os.path.join(GPX_DIR, os.path.basename(gpx_path))
        if not os.path.exists(local_path):
            print(f'  Fichier manquant : {local_path}')
            continue

        polyline = parse_polyline(local_path)
        if not polyline:
            print(f'  Tracé vide : {local_path}')
            continue

        race['polyline'] = polyline
        updated += 1
        print(f'  {race["name"][:40]:<40} {len(polyline)} points')

    with open(RACES_JSON, 'w', encoding='utf-8') as f:
        json.dump(races, f, ensure_ascii=False, indent=2)

    print(f'\n{updated} courses mises à jour dans races.json')


if __name__ == '__main__':
    main()
