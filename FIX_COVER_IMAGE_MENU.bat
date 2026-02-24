@echo off
title ANANTA - Fix Cover Image (Complete Guide)
color 0F

:MENU
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         ANANTA - Cover Image Fix Setup                    ║
echo ║         Choose an option:                                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo  [1] Show SQL command (copy and run in PostgreSQL)
echo  [2] Restart backend with new code
echo  [3] Test cover image upload
echo  [4] Test complete profile (name + cover)
echo  [5] Exit
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto SHOW_SQL
if "%choice%"=="2" goto RESTART_BACKEND
if "%choice%"=="3" goto TEST_COVER
if "%choice%"=="4" goto TEST_COMPLETE
if "%choice%"=="5" goto END
goto MENU

:SHOW_SQL
cls
echo.
echo ════════════════════════════════════════════════════════════
echo  SQL Command to Add Cover Image Column
echo ════════════════════════════════════════════════════════════
echo.
echo Copy and run this in your PostgreSQL database:
echo.
echo ┌────────────────────────────────────────────────────────┐
type D:\Office\ANANTA-APP\adminpanel\backend\add_cover_image.sql
echo └────────────────────────────────────────────────────────┘
echo.
echo After running the SQL, press any key to continue...
pause >nul
goto MENU

:RESTART_BACKEND
cls
echo.
echo ════════════════════════════════════════════════════════════
echo  Restarting Backend
echo ════════════════════════════════════════════════════════════
echo.
echo Stopping old backend...
taskkill /F /IM java.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✓ Stopped
echo.
echo Starting new backend...
cd /d D:\Office\ANANTA-APP\adminpanel\backend
start "ANANTA Backend" cmd /k "mvn spring-boot:run"
echo.
echo Backend is starting in a new window...
echo Wait 30 seconds for it to fully start.
echo.
pause
goto MENU

:TEST_COVER
cls
echo.
echo ════════════════════════════════════════════════════════════
echo  Testing Cover Image Upload
echo ════════════════════════════════════════════════════════════
echo.
cd /d D:\Office\ANANTA-APP\Anantaapp
node test-cover-image.mjs
echo.
pause
goto MENU

:TEST_COMPLETE
cls
echo.
echo ════════════════════════════════════════════════════════════
echo  Testing Complete Profile (Name + Cover)
echo ════════════════════════════════════════════════════════════
echo.
cd /d D:\Office\ANANTA-APP\Anantaapp
node test-complete-profile.mjs
echo.
pause
goto MENU

:END
echo.
echo Goodbye!
timeout /t 2 /nobreak >nul
exit
