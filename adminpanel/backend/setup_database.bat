@echo off
echo ========================================
echo ANANTA User Management - Database Setup
echo ========================================
echo.

echo This script will add the new ban_until and ban_reason columns to your users table.
echo.

set /p DB_NAME="Enter your database name (default: ananta): "
if "%DB_NAME%"=="" set DB_NAME=ananta

set /p DB_USER="Enter your database username (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

echo.
echo Database: %DB_NAME%
echo Username: %DB_USER%
echo.
echo Running migration...
echo.

psql -U %DB_USER% -d %DB_NAME% -f add_ban_columns.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Rebuild the backend: cd .. ^&^& mvn clean install
    echo 2. Restart your Spring Boot application
    echo 3. Restart the admin panel: cd ../../ ^&^& npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Database name and username are correct
    echo 3. You have the correct permissions
    echo.
)

pause
