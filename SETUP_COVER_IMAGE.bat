@echo off
title Setup & Test Cover Image Feature
color 0B

echo.
echo ════════════════════════════════════════════════
echo    ANANTA - Cover Image Feature Setup
echo ════════════════════════════════════════════════
echo.

echo This will:
echo  1. Add cover_image column to database
echo  2. Restart backend with new code
echo  3. Test cover image upload
echo.
pause

echo.
echo [1/4] Adding cover_image column to database...
echo.
echo Please run this SQL command in your PostgreSQL:
echo.
type D:\Office\ANANTA-APP\adminpanel\backend\add_cover_image.sql
echo.
echo.
echo Press any key after running the SQL command...
pause >nul

echo.
echo [2/4] Stopping backend...
taskkill /F /IM java.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✓ Backend stopped

echo.
echo [3/4] Starting backend with new code...
cd /d D:\Office\ANANTA-APP\adminpanel\backend
start "ANANTA Backend" cmd /k "mvn spring-boot:run"
echo.
echo Waiting 30 seconds for backend to start...
timeout /t 30 /nobreak

echo.
echo [4/4] Testing cover image upload...
cd /d D:\Office\ANANTA-APP\Anantaapp
node test-cover-image.mjs

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ════════════════════════════════════════════════
    echo              ✓✓✓ ALL DONE! ✓✓✓
    echo    Cover image feature is working!
    echo.
    echo Now you can:
    echo  - Open the app
    echo  - Go to Profile
    echo  - Tap camera icon on cover image
    echo  - Select new image
    echo  - It will save to backend!
    echo ════════════════════════════════════════════════
) else (
    echo.
    echo ════════════════════════════════════════════════
    echo              ✗✗✗ FAILED ✗✗✗
    echo    Something went wrong
    echo ════════════════════════════════════════════════
)

echo.
pause
