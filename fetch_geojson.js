const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/fahim-muntasir-niloy/Bangladesh-geojson_project/master/Geo%20Json%20Maps/BD_Districts.json';
const dest = 'BD_Districts.json';

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to get '${url}' (${res.statusCode})`);
    return;
  }
  
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      fs.writeFileSync(dest, data);
      const parsed = JSON.parse(data);
      console.log('Successfully downloaded JSON. Features count:', parsed.features.length);
      console.log('First feature properties:', parsed.features[0].properties);
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
