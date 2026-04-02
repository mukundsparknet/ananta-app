// Test script to verify admin login functionality
const axios = require('axios');

async function testAdminLogin() {
    console.log('🔍 Testing Admin Login...\n');
    
    try {
        // Test 1: Check if backend is running
        console.log('1. Testing backend health...');
        try {
            const healthResponse = await axios.get('https://admin.anantalive.com/health', {
                timeout: 5000
            });
            console.log('✅ Backend is running');
        } catch (error) {
            console.log('❌ Backend health check failed:', error.message);
        }
        
        // Test 2: Test login endpoint
        console.log('\n2. Testing login endpoint...');
        const loginData = {
            email: 'admin@ananta.com',
            password: 'Admin@123'
        };
        
        const loginResponse = await axios.post('https://admin.anantalive.com/api/admin/login', loginData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Login successful!');
        console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
        console.log('Email:', loginResponse.data.email);
        console.log('Role:', loginResponse.data.role);
        
        // Test 3: Test token verification
        if (loginResponse.data.token) {
            console.log('\n3. Testing token verification...');
            try {
                const verifyResponse = await axios.get('https://admin.anantalive.com/api/admin/verify-token', {
                    headers: {
                        'Authorization': `Bearer ${loginResponse.data.token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                });
                
                console.log('✅ Token verification successful!');
                console.log('Verified email:', verifyResponse.data.email);
            } catch (error) {
                console.log('❌ Token verification failed:', error.response?.data?.message || error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.message || error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testAdminLogin();