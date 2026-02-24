@echo off
title Test Cover Image Upload
color 0E

echo.
echo ════════════════════════════════════════════════
echo    Testing Cover/Background Image Upload
echo ════════════════════════════════════════════════
echo.

echo [Step 1] Checking backend...
curl -s http://localhost:3000/api/app/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend not running!
    echo.
    echo Start backend first:
    echo    cd D:\Office\ANANTA-APP\adminpanel\backend
    echo    mvn spring-boot:run
    echo.
    pause
    exit /b 1
)
echo ✓ Backend is running
echo.

echo [Step 2] Testing cover image upload...
cd /d D:\Office\ANANTA-APP\Anantaapp
node test-cover-image.mjs

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ════════════════════════════════════════════════
    echo              ✓✓✓ SUCCESS! ✓✓✓
    echo    Cover image upload is working!
    echo ════════════════════════════════════════════════
) else (
    echo.
    echo ════════════════════════════════════════════════
    echo              ✗✗✗ FAILED ✗✗✗
    echo    Cover image upload not working
    echo ════════════════════════════════════════════════
)

echo.
pause
