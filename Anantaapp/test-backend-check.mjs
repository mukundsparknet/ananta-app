const API_BASE = 'https://ecofuelglobal.com';

async function main() {
  console.log('=== Backend Availability Check ===\n');

  // Test different endpoints
  const endpoints = [
    '/api/app/health',
    '/api/app/profile/AN9C263087',
    '/health',
    '/',
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${API_BASE}${endpoint}`;
      console.log(`Testing: ${url}`);
      const res = await fetch(url);
      console.log(`  Status: ${res.status}`);
      const text = await res.text();
      console.log(`  Response: ${text.substring(0, 100)}...\n`);
    } catch (err) {
      console.log(`  Error: ${err.message}\n`);
    }
  }

  // Check if it's a port issue
  console.log('\n=== Checking port 8082 ===');
  try {
    const res = await fetch('https://ecofuelglobal.com:8082/api/app/health');
    console.log('Port 8082 Status:', res.status);
    const json = await res.json().catch(() => null);
    console.log('Response:', json);
  } catch (err) {
    console.log('Port 8082 Error:', err.message);
  }
}

main().catch(console.error);
