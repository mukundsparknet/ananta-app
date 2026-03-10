@echo off
echo ========================================
echo ANANTA Android Google Auth Setup
echo ========================================
echo.

echo Step 1: Getting SHA-1 fingerprint...
echo.
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android | findstr SHA1
echo.
echo Copy the SHA-1 fingerprint above for Google Cloud Console
echo.

echo Step 2: Checking google-services.json...
cd /d "d:\Office\ANANTA-APP\Anantaapp"
if exist google-services.json (
    echo ✅ google-services.json found
) else (
    echo ❌ google-services.json NOT found
    echo Please download from Google Cloud Console and place here
    echo See google-services.json.template for reference
)
echo.

echo Step 3: Installing dependencies...
npm install
echo.

echo Step 4: Building for Android...
echo Starting Expo development build...
npx expo run:android
echo.

echo ========================================
echo Android Setup Instructions:
echo ========================================
echo 1. Use the SHA-1 fingerprint above in Google Cloud Console
echo 2. Create Android OAuth client with package: com.techvivek32.Ananta
echo 3. Download google-services.json to this directory
echo 4. Update GoogleAuthService.ts with your client IDs
echo 5. Test on real Android device (not emulator)
echo.
pause