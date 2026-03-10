@echo off
echo ========================================
echo ANANTA Google Authentication Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
cd /d "d:\Office\ANANTA-APP\Anantaapp"
npm install
echo Dependencies installed!
echo.

echo Step 2: Starting backend server...
cd /d "d:\Office\ANANTA-APP\adminpanel\backend"
start "Backend Server" cmd /k "mvn spring-boot:run"
echo Backend server starting...
echo.

echo Step 3: Starting React Native app...
cd /d "d:\Office\ANANTA-APP\Anantaapp"
start "React Native App" cmd /k "npm start"
echo React Native app starting...
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Before testing Google login:
echo 1. Configure Google Cloud Console credentials
echo 2. Update GoogleAuthService.ts with your Web Client ID
echo 3. See GOOGLE_AUTH_SETUP.md for detailed instructions
echo.
echo The app will be available at:
echo - Web: http://localhost:8081
echo - Backend API: http://localhost:8080
echo.
pause