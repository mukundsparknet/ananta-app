@echo off
echo Building signed AAB with version code 1...

REM Set environment variables
set NODE_ENV=production
set ANDROID_HOME=C:\Users\manoj\AppData\Local\Android\Sdk

REM Navigate to android directory
cd android

REM Clean previous builds
call gradlew clean

REM Build the signed AAB
call gradlew bundleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS: Signed AAB built successfully!
    echo Location: android\app\build\outputs\bundle\release\app-release.aab
    echo Version Code: 1
    echo.
    dir "app\build\outputs\bundle\release\" /b
) else (
    echo.
    echo ❌ FAILED: Build failed with error code %ERRORLEVEL%
)

pause