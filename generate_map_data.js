const fs = require('fs');
const turf = require('@turf/turf');
const path = require('path');

// 1. Load GeoJSON
const geojsonRaw = fs.readFileSync('node_modules/bangladesh-geojson/src/data/bangladesh.geojson', 'utf8');
const upazilas = JSON.parse(geojsonRaw);

// 2. Group by district
const districtsMap = new Map();

for (const feature of upazilas.features) {
  let districtName = feature.properties.district_name;
  
  // Clean names to match existing data
  if (districtName === "Jashore") districtName = "Jessore";
  if (districtName === "Bogura") districtName = "Bogura"; // Keep as is, or Bogra? Existing data uses "Bogura"
  if (districtName === "Chattogram") districtName = "Chattogram"; 
  if (districtName === "Cumilla") districtName = "Cumilla";
  if (districtName === "Brahmanbaria") districtName = "Brahmanbaria";
  if (districtName === "Chapai Nawabganj" || districtName === "Nawabganj") districtName = "Chapai Nawabganj";
  
  if (!districtsMap.has(districtName)) {
    districtsMap.set(districtName, []);
  }
  districtsMap.get(districtName).push(feature);
}

// 3. Merge upazilas into districts and simplify
const districtFeatures = [];
for (const [name, features] of districtsMap.entries()) {
  let merged = features[0];
  for (let i = 1; i < features.length; i++) {
    try {
      merged = turf.union(turf.featureCollection([merged, features[i]]));
    } catch (e) {
      console.error('Error merging', name, e.message);
    }
  }
  
  // Simplify
  const simplified = turf.simplify(merged, { tolerance: 0.005, highQuality: true });
  simplified.properties = { name };
  districtFeatures.push(simplified);
}

// 4. Projection logic
const SVG_W = 800;
const SVG_H = 900;
const LON_MIN = 87.95;
const LON_MAX = 92.78;
const LAT_MIN = 20.55;
const LAT_MAX = 26.72;

function lonToX(lon) { return ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * SVG_W; }
function latToY(lat) { return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * SVG_H; }

// Convert coordinates to SVG path string
function coordsToPath(coords) {
  return coords.map((ring) => {
    return ring.map((pt, i) => {
      const x = lonToX(pt[0]);
      const y = latToY(pt[1]);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ') + ' Z';
  }).join(' ');
}

// 5. Generate outputs
const outputData = {};

for (const feature of districtFeatures) {
  const name = feature.properties.name;
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, ''); // crude ID
  
  let svgPath = '';
  if (feature.geometry.type === 'Polygon') {
    svgPath = coordsToPath(feature.geometry.coordinates);
  } else if (feature.geometry.type === 'MultiPolygon') {
    svgPath = feature.geometry.coordinates.map(coords => coordsToPath(coords)).join(' ');
  }
  
  // Calculate centroid
  let c = turf.centroid(feature).geometry.coordinates;
  const cx = lonToX(c[0]);
  const cy = latToY(c[1]);
  
  outputData[id] = {
    originalName: name,
    svgPath,
    cx: cx.toFixed(2),
    cy: cy.toFixed(2)
  };
}

fs.writeFileSync('district_paths.json', JSON.stringify(outputData, null, 2));
console.log(`Generated SVG paths for ${Object.keys(outputData).length} districts.`);
