const API_BASE = 'https://ecofuelglobal.com';

const testUserId = 'ANAD2E8B50';

const payload = {
  userId: testUserId,
  username: 'Vivek',
  fullName: 'Vivek Vora',
};

async function main() {
  const updateRes = await fetch(`${API_BASE}/api/app/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log('Update status:', updateRes.status);
  let updateJson = null;
  try {
    updateJson = await updateRes.json();
  } catch {
  }
  console.log('Update response:', updateJson);

  const getRes = await fetch(`${API_BASE}/api/app/profile/${testUserId}`);
  console.log('Get status:', getRes.status);
  let getJson = null;
  try {
    getJson = await getRes.json();
  } catch {
  }
  if (getJson && getJson.user) {
    console.log('User after update:', {
      userId: getJson.user.userId,
      username: getJson.user.username,
      fullName: getJson.user.fullName,
    });
  } else {
    console.log('Raw get response:', getJson);
  }
}

main().catch((err) => {
  console.error('Error running test script:', err);
  process.exit(1);
});

