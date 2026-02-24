@echo off
title Complete Profile Test
color 0A

echo.
echo ════════════════════════════════════════════════════════════
echo    ANANTA - Complete Profile Feature Test
echo    Testing: Name Change + Cover Image Upload
echo ════════════════════════════════════════════════════════════
echo.

echo Checking backend...
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

cd /d D:\Office\ANANTA-APP\Anantaapp
node test-complete-profile.mjs

echo.
pause
