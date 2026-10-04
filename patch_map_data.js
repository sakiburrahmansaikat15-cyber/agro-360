const fs = require('fs');

const svgData = JSON.parse(fs.readFileSync('district_paths.json', 'utf8'));
let mapData = fs.readFileSync('lib/map-data.ts', 'utf8');

// The keys in svgData might differ slightly from the ids in mapData.
// Let's create a mapping for the tricky ones.
const keyMap = {
  'chapai nawabganj': 'chapainawabganj',
  'cox\'s bazar': 'coxsbazar',
  'jhalokathi': 'jhalokati', // svg data has jhalokati
  'khagrachhari': 'khagrachari',
  'moulvibazar': 'maulvibazar',
  'sirajganj': 'sirajgonj'
};

const mapDataLines = mapData.split('\n');
const newLines = [];
let currentId = null;

for (let i = 0; i < mapDataLines.length; i++) {
  const line = mapDataLines[i];
  
  const idMatch = line.match(/id:\s*"([^"]+)"/);
  if (idMatch) {
    currentId = idMatch[1];
  }
  
  if (line.includes('polygon: box(')) {
    let lookupKey = currentId;
    if (keyMap[currentId]) lookupKey = keyMap[currentId];
    else if (currentId === 'coxsbazar') lookupKey = 'coxsbazar';
    else if (currentId === 'chapainawabganj') lookupKey = 'chapainawabganj';
    
    // Find the svg path data
    let found = svgData[lookupKey];
    if (!found) {
      console.log('NOT FOUND in svg data:', currentId, 'tried:', lookupKey);
      newLines.push(line);
      continue;
    }
    
    newLines.push(`    svgPath: "${found.svgPath}",`);
    newLines.push(`    cx: ${found.cx},`);
    newLines.push(`    cy: ${found.cy},`);
  } else {
    newLines.push(line);
  }
}

// Write the patched file to a temp file, we'll manually replace lib/map-data.ts
fs.writeFileSync('lib/map-data-new.ts', newLines.join('\n'));
console.log('Successfully generated lib/map-data-new.ts');
