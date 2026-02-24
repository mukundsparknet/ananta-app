const API_BASE = 'http://localhost:3000';
const testUserId = 'AND6926A9B';

// Small test image (1x1 red pixel)
const testCoverImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

async function main() {
  console.log('🖼️  Testing cover image upload...');
  console.log('━'.repeat(50));
  
  // Update cover image
  const updateRes = await fetch(`${API_BASE}/api/app/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: testUserId,
      coverImage: testCoverImage,
    }),
  });
  
  console.log(`📤 Update Status: ${updateRes.status}`);
  
  if (updateRes.status !== 200) {
    const error = await updateRes.text();
    console.log('❌ FAILED:', error);
    process.exit(1);
  }

  // Wait a bit
  await new Promise(r => setTimeout(r, 1000));

  // Fetch profile to verify
  const getRes = await fetch(`${API_BASE}/api/app/profile/${testUserId}`);
  const getJson = await getRes.json();
  
  if (getJson && getJson.user) {
    const { coverImage } = getJson.user;
    console.log(`📥 Cover Image: ${coverImage ? coverImage.substring(0, 50) + '...' : 'null'}`);
    console.log('━'.repeat(50));
    
    if (coverImage && coverImage.length > 0) {
      console.log('✅ SUCCESS! Cover image saved');
      process.exit(0);
    } else {
      console.log('⚠️  Cover image not saved');
      process.exit(1);
    }
  } else {
    console.log('❌ FAILED - Could not fetch user data');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
