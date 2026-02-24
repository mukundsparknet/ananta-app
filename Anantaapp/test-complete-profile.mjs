const API_BASE = 'http://localhost:3000';
const testUserId = 'AND6926A9B';

// Small test image (1x1 pixel)
const testCoverImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

async function main() {
  console.log('🧪 COMPLETE PROFILE TEST');
  console.log('━'.repeat(60));
  console.log('Testing: Name change + Cover image upload');
  console.log('━'.repeat(60));
  console.log('');

  // Test 1: Update name and cover image together
  console.log('📝 Test 1: Updating name to "MJ Rajput" + cover image...');
  const updateRes = await fetch(`${API_BASE}/api/app/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: testUserId,
      username: 'MJ Rajput',
      fullName: 'MJ Rajput',
      bio: 'Updated via complete test',
      coverImage: testCoverImage,
    }),
  });
  
  console.log(`   Status: ${updateRes.status}`);
  
  if (updateRes.status !== 200) {
    const error = await updateRes.text();
    console.log('   ❌ Update failed:', error);
    process.exit(1);
  }
  console.log('   ✅ Update successful');
  console.log('');

  // Wait for database to update
  await new Promise(r => setTimeout(r, 1500));

  // Test 2: Verify changes
  console.log('📥 Test 2: Verifying changes...');
  const getRes = await fetch(`${API_BASE}/api/app/profile/${testUserId}`);
  const getJson = await getRes.json();
  
  if (!getJson || !getJson.user) {
    console.log('   ❌ Could not fetch profile');
    process.exit(1);
  }

  const { username, fullName, coverImage } = getJson.user;
  
  console.log('   Current username:', username);
  console.log('   Current fullName:', fullName);
  console.log('   Cover image:', coverImage ? '✓ Present' : '✗ Missing');
  console.log('');

  // Check results
  let allPassed = true;
  
  console.log('📊 Results:');
  console.log('━'.repeat(60));
  
  if (username === 'MJ Rajput') {
    console.log('   ✅ Username changed to "MJ Rajput"');
  } else {
    console.log(`   ❌ Username is "${username}" (expected "MJ Rajput")`);
    allPassed = false;
  }
  
  if (fullName === 'MJ Rajput') {
    console.log('   ✅ Full name changed to "MJ Rajput"');
  } else {
    console.log(`   ❌ Full name is "${fullName}" (expected "MJ Rajput")`);
    allPassed = false;
  }
  
  if (coverImage && coverImage.length > 0) {
    console.log('   ✅ Cover image saved successfully');
  } else {
    console.log('   ❌ Cover image not saved');
    allPassed = false;
  }
  
  console.log('━'.repeat(60));
  console.log('');

  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✓ Profile name changes work');
    console.log('✓ Cover image upload works');
    console.log('✓ Both features working together');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('Check the results above for details');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
