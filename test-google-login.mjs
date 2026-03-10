import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:8080';

async function testGoogleLogin() {
  console.log('🧪 Testing Google Login API...\n');

  // Test 1: New user (email doesn't exist)
  console.log('Test 1: New user registration via Google');
  try {
    const newUserResponse = await fetch(`${API_BASE_URL}/api/app/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'newuser@gmail.com',
        name: 'New User',
        profileImage: 'https://example.com/profile.jpg'
      }),
    });

    const newUserResult = await newUserResponse.json();
    console.log('✅ New user response:', newUserResult);
    console.log('Expected: redirectTo = "profile"\n');
  } catch (error) {
    console.log('❌ New user test failed:', error.message);
  }

  // Test 2: Existing user (email exists)
  console.log('Test 2: Existing user login via Google');
  try {
    // First create a user
    const createUserResponse = await fetch(`${API_BASE_URL}/api/app/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+1234567890',
        otp: '12345'
      }),
    });

    const createUserResult = await createUserResponse.json();
    console.log('User created:', createUserResult.userId);

    // Update user with email
    const updateResponse = await fetch(`${API_BASE_URL}/api/app/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: createUserResult.userId,
        username: 'testuser',
        email: 'existinguser@gmail.com',
        documentType: 'Aadhaar Card',
        documentNumber: '1234567890',
        documentFrontImage: 'data:image/jpeg;base64,test',
        documentBackImage: 'data:image/jpeg;base64,test'
      }),
    });

    // Now test Google login with existing email
    const existingUserResponse = await fetch(`${API_BASE_URL}/api/app/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'existinguser@gmail.com',
        name: 'Existing User',
        profileImage: 'https://example.com/profile.jpg'
      }),
    });

    const existingUserResult = await existingUserResponse.json();
    console.log('✅ Existing user response:', existingUserResult);
    console.log('Expected: redirectTo = "home"\n');
  } catch (error) {
    console.log('❌ Existing user test failed:', error.message);
  }

  // Test 3: Invalid request (missing email)
  console.log('Test 3: Invalid request (missing email)');
  try {
    const invalidResponse = await fetch(`${API_BASE_URL}/api/app/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'User Without Email'
      }),
    });

    const invalidResult = await invalidResponse.json();
    console.log('✅ Invalid request response:', invalidResult);
    console.log('Expected: Error message about missing email\n');
  } catch (error) {
    console.log('❌ Invalid request test failed:', error.message);
  }

  console.log('🎉 Google Login API tests completed!');
}

// Run tests
testGoogleLogin().catch(console.error);