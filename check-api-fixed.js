const https = require('https');
const apiKey = "AIzaSyD7rN5AEKP8-C9NxrMwqEXSloH-oVX-T-o";

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.log("API Error:", json.error.message);
      } else {
        console.log("Available Models:");
        json.models.forEach(m => console.log(`- ${m.name}`));
      }
    } catch (e) {
      console.log("Parse Error:", e.message);
    }
  });
}).on('error', (err) => {
  console.log("Net Error:", err.message);
});
