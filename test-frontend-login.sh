#!/bin/bash
echo "🔍 FRONTEND LOGIN FLOW TEST"
echo "=========================="
echo ""

echo "1️⃣ Testing Frontend Accessibility..."
FRONTEND_RESPONSE=$(curl -s --connect-timeout 5 --max-time 10 https://admin.anantalive.com)
if [ $? -eq 0 ] && [ -n "$FRONTEND_RESPONSE" ]; then
    echo "✅ Frontend: Accessible"
    if echo "$FRONTEND_RESPONSE" | grep -q -i "login\|sign"; then
        echo "   📄 Contains login elements"
    fi
else
    echo "❌ Frontend: Not accessible"
fi

echo ""
echo "2️⃣ Testing Login Page Specifically..."
LOGIN_PAGE=$(curl -s --connect-timeout 5 --max-time 10 https://admin.anantalive.com/login)
if [ $? -eq 0 ] && [ -n "$LOGIN_PAGE" ]; then
    echo "✅ Login page: Accessible"
    if echo "$LOGIN_PAGE" | grep -q -i "email\|password"; then
        echo "   📄 Contains login form"
    fi
else
    echo "❌ Login page: Not accessible"
fi

echo ""
echo "3️⃣ Testing Users Page (Should redirect to login if not authenticated)..."
USERS_PAGE=$(curl -s --connect-timeout 5 --max-time 10 https://admin.anantalive.com/users)
if [ $? -eq 0 ] && [ -n "$USERS_PAGE" ]; then
    echo "✅ Users page: Accessible"
    if echo "$USERS_PAGE" | grep -q -i "login\|sign"; then
        echo "   🔄 Redirects to login (expected behavior)"
    elif echo "$USERS_PAGE" | grep -q -i "user\|admin"; then
        echo "   ⚠️  Shows admin content (unexpected - should redirect to login)"
    fi
else
    echo "❌ Users page: Not accessible"
fi

echo ""
echo "4️⃣ Testing API Endpoints from Frontend Domain..."
echo "Backend login through frontend domain:"
API_LOGIN=$(curl -s --connect-timeout 5 --max-time 10 -X POST https://admin.anantalive.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ananta.com","password":"Admin@123"}')

if echo "$API_LOGIN" | grep -q "token"; then
    echo "✅ API Login: Working"
    TOKEN=$(echo "$API_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   📝 Token: ${TOKEN:0:50}..."
else
    echo "❌ API Login: Failed"
    echo "   📄 Response: $API_LOGIN"
fi

echo ""
echo "5️⃣ Testing Token Verification..."
if [ -n "$TOKEN" ]; then
    TOKEN_VERIFY=$(curl -s --connect-timeout 5 --max-time 10 -X GET https://admin.anantalive.com/api/admin/verify-token \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$TOKEN_VERIFY" | grep -q "valid"; then
        echo "✅ Token Verification: Working"
        echo "   📄 Response: $TOKEN_VERIFY"
    else
        echo "❌ Token Verification: Failed"
        echo "   📄 Response: $TOKEN_VERIFY"
    fi
else
    echo "⏭️  Token Verification: Skipped (no token)"
fi

echo ""
echo "6️⃣ Testing CORS Headers..."
CORS_TEST=$(curl -s -I --connect-timeout 5 --max-time 10 -X OPTIONS https://admin.anantalive.com/api/admin/login \
  -H "Origin: https://admin.anantalive.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$CORS_TEST" | grep -q "Access-Control-Allow"; then
    echo "✅ CORS: Headers present"
    echo "$CORS_TEST" | grep "Access-Control"
else
    echo "❌ CORS: No headers found"
fi

echo ""
echo "7️⃣ Frontend Service Status..."
echo "Checking if frontend is running on port 3011:"
if netstat -tulpn 2>/dev/null | grep -q ":3011"; then
    echo "✅ Port 3011: Listening"
else
    echo "❌ Port 3011: Not listening"
fi

echo ""
echo "8️⃣ Browser Simulation Test..."
echo "Simulating browser login flow:"

# Step 1: Get login page
echo "   📄 Step 1: Getting login page..."
LOGIN_COOKIES=$(mktemp)
curl -s -c "$LOGIN_COOKIES" https://admin.anantalive.com/login > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Login page loaded"
else
    echo "   ❌ Failed to load login page"
fi

# Step 2: Attempt login with cookies
echo "   🔐 Step 2: Attempting login..."
LOGIN_RESULT=$(curl -s -b "$LOGIN_COOKIES" -c "$LOGIN_COOKIES" \
  -X POST https://admin.anantalive.com/api/admin/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://admin.anantalive.com" \
  -H "Referer: https://admin.anantalive.com/login" \
  -d '{"email":"admin@ananta.com","password":"Admin@123"}')

if echo "$LOGIN_RESULT" | grep -q "token"; then
    echo "   ✅ Login successful"
    BROWSER_TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Step 3: Try to access protected page
    echo "   🔒 Step 3: Accessing protected page..."
    PROTECTED_ACCESS=$(curl -s -b "$LOGIN_COOKIES" \
      -H "Authorization: Bearer $BROWSER_TOKEN" \
      https://admin.anantalive.com/users)
    
    if [ $? -eq 0 ] && [ -n "$PROTECTED_ACCESS" ]; then
        echo "   ✅ Protected page accessible"
        if echo "$PROTECTED_ACCESS" | grep -q -i "user\|admin\|dashboard"; then
            echo "   📄 Shows admin content"
        elif echo "$PROTECTED_ACCESS" | grep -q -i "login"; then
            echo "   🔄 Still shows login (potential issue)"
        fi
    else
        echo "   ❌ Protected page not accessible"
    fi
else
    echo "   ❌ Login failed"
    echo "   📄 Response: $LOGIN_RESULT"
fi

# Cleanup
rm -f "$LOGIN_COOKIES"

echo ""
echo "=========================="
echo "🎯 SUMMARY:"
echo "If login is working via API but not in browser,"
echo "the issue is likely in the frontend JavaScript/React code."
echo ""
echo "Next steps:"
echo "1. Check browser console for JavaScript errors"
echo "2. Check Network tab for failed requests"
echo "3. Verify token storage in localStorage"
echo "=========================="