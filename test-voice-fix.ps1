# 🔧 Voice Announcement Fix - Test Script

Write-Host "🔍 Testing ChatterBox AI Voice System..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check Python Service
Write-Host "1️⃣ Testing Python TTS Service (Port 5001)..." -ForegroundColor Yellow
try {
    $pythonHealth = Invoke-WebRequest -Uri "http://localhost:5001/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Python service is running!" -ForegroundColor Green
    Write-Host "   Response: $($pythonHealth.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Python service is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   👉 Start it with: cd python-tts-service; python app.py" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Check Backend Service
Write-Host "2️⃣ Testing Backend API (Port 5000)..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:5000/api/voices/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $healthData = $backendHealth.Content | ConvertFrom-Json
    Write-Host "   ✅ Backend service is running!" -ForegroundColor Green
    Write-Host "   Response: $($backendHealth.Content)" -ForegroundColor Gray
    
    if ($healthData.status -eq "ok") {
        Write-Host "   ✅ Health check status: OK" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Health check status: $($healthData.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Backend service is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   👉 Start it with: cd backend; node server.js" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Test Voice Synthesis
Write-Host "3️⃣ Testing Voice Synthesis..." -ForegroundColor Yellow
try {
    $body = @{
        text = "Test ticket number one"
        language = "en"
        rate = 0.9
        pitch = 1.0
        voiceId = ""
    } | ConvertTo-Json

    Write-Host "   Sending request to: http://localhost:5000/api/voices/synthesize" -ForegroundColor Gray
    Write-Host "   Body: $body" -ForegroundColor Gray
    
    $synthResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/voices/synthesize" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
    $synthData = $synthResponse.Content | ConvertFrom-Json
    
    if ($synthData.success -and $synthData.audioUrl) {
        Write-Host "   ✅ Synthesis successful!" -ForegroundColor Green
        Write-Host "   Audio URL: $($synthData.audioUrl)" -ForegroundColor Gray
        
        # Test if audio file is accessible
        Write-Host "   Testing audio file accessibility..." -ForegroundColor Gray
        try {
            $audioTest = Invoke-WebRequest -Uri $synthData.audioUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
            Write-Host "   ✅ Audio file is accessible! (Size: $($audioTest.RawContentLength) bytes)" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Audio file is NOT accessible!" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Synthesis failed!" -ForegroundColor Red
        Write-Host "   Response: $($synthResponse.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Synthesis request failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check localStorage settings (manual)
Write-Host "4️⃣ Check Frontend Settings..." -ForegroundColor Yellow
Write-Host "   👉 Open browser DevTools → Application → Local Storage" -ForegroundColor Cyan
Write-Host "   👉 Look for key: tts_settings" -ForegroundColor Cyan
Write-Host "   👉 Should contain: selectedChatterboxVoice, speechRate, speechPitch, preferredLanguage" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "If all tests pass:" -ForegroundColor White
Write-Host "  ✅ Python service: Running" -ForegroundColor Green
Write-Host "  ✅ Backend API: Running" -ForegroundColor Green
Write-Host "  ✅ Synthesis: Working" -ForegroundColor Green
Write-Host "  ✅ Audio: Accessible" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open Configuration page: http://localhost:3000/admin/configuration" -ForegroundColor Cyan
Write-Host "  2. Save voice settings" -ForegroundColor Cyan
Write-Host "  3. Open Ticket Info page: http://localhost:3000/ticket_info" -ForegroundColor Cyan
Write-Host "  4. Call a ticket and check browser console for logs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Console should show:" -ForegroundColor Yellow
Write-Host "  ✅ ChatterBox AI Voice service is ready" -ForegroundColor Green
Write-Host "  🆕 NEW TICKET DETECTED!" -ForegroundColor Green
Write-Host "  🎙️ Announcing with ChatterBox AI: Ticket number..." -ForegroundColor Green
Write-Host "  ✅ ChatterBox AI audio generated: http://..." -ForegroundColor Green
Write-Host "  ▶️ AI voice announcement started" -ForegroundColor Green
Write-Host "  ✅ AI voice announcement completed" -ForegroundColor Green
Write-Host ""
