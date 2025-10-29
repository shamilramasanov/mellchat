// Test script to check available Gemini models
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.log('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

console.log('🔍 Checking available Gemini models...');

// Test new API endpoint
const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: '/v1beta/models',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Available models:');
      
      if (response.models) {
        response.models.forEach(model => {
          console.log(`  - ${model.name}`);
          if (model.displayName) {
            console.log(`    Display Name: ${model.displayName}`);
          }
          if (model.description) {
            console.log(`    Description: ${model.description}`);
          }
          console.log('');
        });
      } else {
        console.log('No models found in response');
        console.log('Response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.end();
