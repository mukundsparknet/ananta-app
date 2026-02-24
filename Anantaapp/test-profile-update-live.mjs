const API_BASE = 'https://ecofuelglobal.com';

// Live user to test – adjust if needed
const testUserId = 'AN9C263087';

const payload = {
  userId: testUserId,
  username: 'Manoj',
  fullName: 'Manoj QA',
};

async function main() {
  console.log('Hitting live API:', `${API_BASE}/api/app/profile`);
  console.log('Payload:', payload);

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
      bio: getJson.user.bio,
      location: getJson.user.location,
    });
  } else {
    console.log('Raw get response:', getJson);
  }
}

main().catch((err) => {
  console.error('Error running live test script:', err);
  process.exit(1);
});
