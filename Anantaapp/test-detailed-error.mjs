const API_BASE = 'https://ecofuelglobal.com';
const testUserId = 'AN9C263087';

async function main() {
  console.log('=== Detailed Error Test ===\n');

  const payload = {
    userId: testUserId,
    username: 'Manoj',
    fullName: 'Manoj QA',
    bio: null,
    location: null,
    gender: null,
    birthday: null,
    addressLine1: null,
    city: null,
    state: null,
    country: null,
    pinCode: null,
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));

  const res = await fetch(`${API_BASE}/api/app/profile`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  console.log('\nStatus:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  
  const text = await res.text();
  console.log('\nRaw Response:', text);

  try {
    const json = JSON.parse(text);
    console.log('\nParsed JSON:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('\nCould not parse as JSON');
  }
}

main().catch(console.error);
