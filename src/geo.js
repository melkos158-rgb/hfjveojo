'use strict';
const fs = require('fs');
const path = require('path');

let boundary = { name: 'Chełm', center: [51.1356, 23.4962], bbox: { minLat: 51.10, minLng: 23.42, maxLat: 51.17, maxLng: 23.58 }, ring: [] };
try {
  boundary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'chelm-boundary.json'), 'utf8'));
} catch (e) { console.error('chelm-boundary.json not loaded:', e.message); }

// ring is [[lat,lng], ...]; ray casting in lng/lat space
function inChelm(lat, lng) {
  const r = boundary.ring;
  if (!Array.isArray(r) || r.length < 3) return false;
  if (!(lat >= boundary.bbox.minLat && lat <= boundary.bbox.maxLat && lng >= boundary.bbox.minLng && lng <= boundary.bbox.maxLng)) return false;
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const yi = r[i][0], xi = r[i][1], yj = r[j][0], xj = r[j][1];
    if (((xi > lng) !== (xj > lng)) && (lat < (yj - yi) * (lng - xi) / (xj - xi) + yi)) inside = !inside;
  }
  return inside;
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=18&addressdetails=1`;
    const r = await fetch(url, { headers: { 'User-Agent': 'RideLabShop/1.0 (kontakt@orvionis.com)', 'Accept-Language': 'pl' }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return '';
    const j = await r.json();
    const a = j.address || {};
    const road = a.road || a.pedestrian || a.footway || a.neighbourhood || '';
    const num = a.house_number ? ' ' + a.house_number : '';
    const parts = [road + num, a.suburb || a.city_district || ''].filter(Boolean);
    return parts.join(', ') || (j.display_name ? j.display_name.split(',').slice(0, 2).join(',') : '');
  } catch (e) { return ''; }
}

module.exports = { boundary, inChelm, reverseGeocode };
