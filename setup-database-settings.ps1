# 🗄️ Database Settings Setup Script

Write-Host "🗄️ Setting up voice_settings table in database..." -ForegroundColor Cyan
Write-Host ""

# Check if backend directory exists
if (-Not (Test-Path "backend")) {
    Write-Host "❌ Error: backend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Run database migration
Write-Host "📊 Creating voice_settings table..." -ForegroundColor Yellow
try {
    cd backend
    node database/create-voice-settings-table.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 What was created:" -ForegroundColor Cyan
        Write-Host "  • voice_settings table" -ForegroundColor White
        Write-Host "  • Columns: admin_id, voice_type, language, speech_rate, speech_pitch" -ForegroundColor White
        Write-Host "  • Default settings inserted" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Restart backend: cd backend; node server.js" -ForegroundColor Cyan
        Write-Host "  2. Open Configuration page" -ForegroundColor Cyan
        Write-Host "  3. Settings will now save to database!" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Database setup failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running setup: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    cd ..
}
