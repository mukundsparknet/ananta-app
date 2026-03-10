@echo off
echo ========================================
echo Google Client IDs Setup Helper
echo ========================================
echo.

echo 1. Getting SHA-1 fingerprint for Android:
echo.
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android | findstr SHA1
echo.

echo 2. Package name for Android/iOS: com.techvivek32.Ananta
echo.

echo 3. Authorized origins for Web:
echo    - http://localhost:8081
echo    - http://localhost:19006
echo.

echo 4. Next steps:
echo    - Go to https://console.cloud.google.com/
echo    - Create 3 OAuth clients (Web, Android, iOS)
echo    - Copy Client IDs to GoogleAuthService.ts
echo    - Update app.json with iOS URL scheme
echo.

echo See CLIENT_IDS_SETUP.md for detailed instructions
pause