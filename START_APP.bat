@echo off
title Queue Management System - Startup
color 0A

echo ========================================
echo    QUEUE MANAGEMENT SYSTEM
echo    Starting All Services...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Python TTS Service...
start "Python TTS" cmd /k "cd /d "%~dp0python-tts-service" && python app.py"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Electron Application...
timeout /t 3 /nobreak >nul
cd /d "%~dp0dist\win-unpacked"
start "" "Queue Management System.exe"

echo.
echo ========================================
echo    All Services Started Successfully!
echo ========================================
echo.
echo Backend Server: http://localhost:5000
echo Frontend App: Electron Window
echo Python TTS: http://localhost:5050
echo.
echo Press any key to close this window...
pause >nul
