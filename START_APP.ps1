##############################################
# Queue Management System - Startup Script
# Starts all required services
##############################################

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   QUEUE MANAGEMENT SYSTEM" -ForegroundColor Green
Write-Host "   Starting All Services..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check Node.js installation
Write-Host "[✓] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "    Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js is not installed!" -ForegroundColor Red
    Write-Host "    Please install from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Backend Server
Write-Host "`n[1/3] Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $scriptDir "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Python TTS Service
Write-Host "[2/3] Starting Python TTS Service..." -ForegroundColor Yellow
$pythonPath = Join-Path $scriptDir "python-tts-service"
if (Test-Path $pythonPath) {
    try {
        $pythonVersion = python --version
        Write-Host "    Python version: $pythonVersion" -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pythonPath'; Write-Host 'Python TTS Starting...' -ForegroundColor Green; python app.py" -WindowStyle Normal
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "    [!] Python not found - TTS service skipped" -ForegroundColor Yellow
    }
} else {
    Write-Host "    [!] Python TTS folder not found - skipped" -ForegroundColor Yellow
}

# Start Electron Application
Write-Host "[3/3] Starting Electron Application..." -ForegroundColor Yellow
$appPath = Join-Path $scriptDir "dist\win-unpacked\Queue Management System.exe"

if (Test-Path $appPath) {
    Start-Sleep -Seconds 3
    Start-Process $appPath
    Write-Host "    ✓ Application launched successfully!" -ForegroundColor Green
} else {
    Write-Host "[✗] Application not found at: $appPath" -ForegroundColor Red
    Write-Host "    Please run 'npm run electron:build:win' first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   All Services Started Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  • Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "  • Frontend App: Electron Window" -ForegroundColor White
Write-Host "  • Python TTS:   http://localhost:5050" -ForegroundColor White

Write-Host "`n[Info] Close service windows to stop them" -ForegroundColor Gray
Write-Host "`nPress any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
