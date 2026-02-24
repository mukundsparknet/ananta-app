const API_BASE = 'https://ecofuelglobal.com';
const testUserId = 'AN9C263087';

async function main() {
  console.log('=== Testing Profile Update Debug ===\n');

  // 1. Check if user exists
  console.log('1. Fetching current profile...');
  const getRes = await fetch(`${API_BASE}/api/app/profile/${testUserId}`);
  const getData = await getRes.json();
  console.log('Current user:', {
    userId: getData.user?.userId,
    username: getData.user?.username,
    fullName: getData.user?.fullName,
  });

  // 2. Try minimal update
  console.log('\n2. Trying minimal update (only userId + username)...');
  const minimalPayload = {
    userId: testUserId,
    username: 'TestUser',
  };
  const minRes = await fetch(`${API_BASE}/api/app/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(minimalPayload),
  });
  console.log('Status:', minRes.status);
  const minJson = await minRes.json().catch(() => null);
  console.log('Response:', minJson);

  // 3. Try with all fields empty strings
  console.log('\n3. Trying with all fields as empty strings...');
  const emptyPayload = {
    userId: testUserId,
    username: 'TestUser2',
    fullName: 'Test User Full',
    bio: '',
    location: '',
    gender: '',
    birthday: '',
    addressLine1: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
  };
  const emptyRes = await fetch(`${API_BASE}/api/app/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emptyPayload),
  });
  console.log('Status:', emptyRes.status);
  const emptyJson = await emptyRes.json().catch(() => null);
  console.log('Response:', emptyJson);

  // 4. Check health endpoint
  console.log('\n4. Checking backend health...');
  const healthRes = await fetch(`${API_BASE}/api/app/health`);
  const healthJson = await healthRes.json().catch(() => null);
  console.log('Health:', healthJson);
}

main().catch(console.error);
