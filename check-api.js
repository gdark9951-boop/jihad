const fetch = require('node-fetch');
const apiKey = "AIzaSyD7rN5AEKP8-C9NxrMwqEXSloH-oVX-T-o";

async function checkModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.log("API Error:", data.error.message);
      return;
    }
    
    console.log("Available Models for this key:");
    data.models.forEach(m => {
      console.log(`- ${m.name}`);
    });
  } catch (error) {
    console.error("Fetch Error:", error.message);
  }
}

checkModels();
