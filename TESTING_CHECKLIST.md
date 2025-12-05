# ✅ ChatterBox AI - Testing Checklist

## Pre-Testing Setup

### 1. Verify All Services Running
```powershell
# Terminal 1 - Python TTS Service
cd python-tts-service
python app.py
# Should see: Running on http://127.0.0.1:5001

# Terminal 2 - Node Backend
cd backend
node server.js
# Should see: Server running on port 5000

# Terminal 3 - Next.js Frontend
npm run dev
# Should see: Ready - started server on http://localhost:3000
```

### 2. Check Models Downloaded
```powershell
dir python-tts-service\models
# Should see:
# s3gen.pt (~1.06GB)
# t3_cfg.pt (~1.06GB)
# ve.pt (~5.70MB)
# tokenizer.json (~25.5KB)
```

---

## Test 1: Configuration Page

### Access
- [ ] Navigate to: `http://localhost:3000/[role]/configuration`
- [ ] Replace `[role]` with: `admin`, `dashboard`, `display`, or `user`

### ChatterBox Service Status
- [ ] Top banner shows "🎙️ ChatterBox AI Voice System"
- [ ] Status indicator is green "Online"
- [ ] No red "Offline" warning displayed

### Voice Upload
- [ ] Click "Upload Voice Sample for Cloning"
- [ ] Select audio file (WAV, MP3, OGG, or M4A)
- [ ] File size < 10MB
- [ ] Upload completes successfully
- [ ] Success message displayed

### Voice Selection
- [ ] Open "Select Voice Sample" dropdown
- [ ] See default system voices (🔊)
- [ ] See uploaded voices (📁)
- [ ] Select a voice

### Settings Configuration
- [ ] Choose language from dropdown (English, Urdu, Hindi, etc.)
- [ ] Adjust speech rate slider (0.5x - 2.0x)
- [ ] Observe live rate value updates
- [ ] Adjust speech pitch slider (0.5 - 2.0)
- [ ] Observe live pitch value updates
- [ ] Enter test text in input field

### Test Voice
- [ ] Click "🔊 Test AI Voice" button
- [ ] Button shows "⏳ Generating..." during synthesis
- [ ] Audio plays successfully
- [ ] Hear text spoken with selected settings
- [ ] Voice matches selected voice sample
- [ ] Rate and pitch applied correctly

### Save Settings
- [ ] Click "💾 Save Settings" button
- [ ] Success message displayed
- [ ] Open browser DevTools (F12)
- [ ] Go to Application → Local Storage
- [ ] Find `tts_settings` key
- [ ] Verify JSON contains:
  ```json
  {
    "selectedChatterboxVoice": "...",
    "speechRate": 0.9,
    "speechPitch": 1.0,
    "preferredLanguage": "en",
    "useAI": true
  }
  ```

### UI Validation
- [ ] No browser voice selection sections visible
- [ ] No "Use ChatterBox AI" checkbox (always on)
- [ ] Info banner shows AI information
- [ ] All controls responsive and functional
- [ ] No console errors in DevTools

---

## Test 2: API Endpoints

### Health Check
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/voices/health" | Select-Object -ExpandProperty Content
```
**Expected:**
```json
{"status":"ok","python_service":"online"}
```
- [ ] Status is "ok"
- [ ] python_service is "online"

### Voice List
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/voices/list" | Select-Object -ExpandProperty Content
```
**Expected:**
```json
{
  "success": true,
  "voices": [
    {"id":"default","name":"Default Voice","type":"system"},
    {"id":"voice_123.wav","name":"voice_123.wav","type":"uploaded"}
  ]
}
```
- [ ] Success is true
- [ ] Array contains voices
- [ ] Uploaded voices appear

### Synthesize Speech
```powershell
$body = @{
  text = "Test ticket number one"
  voiceId = ""
  rate = 0.9
  pitch = 1.0
  language = "en"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/voices/synthesize" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content
```
**Expected:**
```json
{
  "success": true,
  "audioUrl": "http://localhost:5001/audio/output_xyz.mp3"
}
```
- [ ] Success is true
- [ ] audioUrl returned
- [ ] Can access audio URL in browser
- [ ] Audio plays correctly

---

## Test 3: Ticket Info Page (End-to-End)

### Setup
1. [ ] Login as admin
2. [ ] Configure voice settings (Test 1)
3. [ ] Save settings
4. [ ] Navigate to Ticket Info page: `http://localhost:3000/ticket_info`

### Service Check
- [ ] Open browser DevTools console
- [ ] See: "✅ ChatterBox AI Voice service is ready"
- [ ] No "❌ ChatterBox AI Voice service offline" errors

### Call a Ticket (Manual Database Update)
```powershell
# In a SQL client or backend script, update tickets table
# UPDATE tickets SET called_at = NOW(), counter_no = 1 WHERE ticket_number = 'A001';
```

### Automatic Announcement
- [ ] Ticket Info page updates within 1-2 seconds
- [ ] Screen shows ticket number
- [ ] Screen shows counter number
- [ ] Console logs:
  ```
  🆕 NEW TICKET DETECTED!
  ✅ All conditions met, scheduling AI voice announcement
  🎙️ Announcing with ChatterBox AI: Ticket number A001 counter 1
  ✅ ChatterBox AI audio generated: http://localhost:5001/audio/...
  ▶️ AI voice announcement started
  ✅ AI voice announcement completed
  ```
- [ ] Audio plays automatically
- [ ] Voice uses saved settings (correct voice, rate, pitch, language)
- [ ] Announcement is clear and understandable

### Cross-Tab Communication
- [ ] Open Ticket Info page in 2+ browser tabs
- [ ] Call a new ticket
- [ ] All tabs update simultaneously
- [ ] All tabs play announcement
- [ ] BroadcastChannel logs in console

### Settings Persistence
- [ ] Change voice settings in Configuration
- [ ] Save settings
- [ ] Refresh Ticket Info page
- [ ] Call new ticket
- [ ] Announcement uses NEW settings
- [ ] No need to reconfigure Ticket Info page

---

## Test 4: Error Handling

### Python Service Offline
1. [ ] Stop Python service (Ctrl+C in terminal)
2. [ ] Reload Configuration page
3. [ ] Status shows red "Offline"
4. [ ] Warning message displayed
5. [ ] Test voice button disabled
6. [ ] Upload button disabled
7. [ ] Restart Python service
8. [ ] Reload page - status green "Online"

### Backend Offline
1. [ ] Stop Node backend
2. [ ] Try to synthesize voice
3. [ ] See network error in console
4. [ ] No audio plays
5. [ ] Restart backend
6. [ ] Retry - works successfully

### Invalid Audio File
1. [ ] Try to upload .txt or .jpg file
2. [ ] See "Only audio files allowed" error
3. [ ] Upload not accepted

### Large File Upload
1. [ ] Try to upload audio file > 10MB
2. [ ] See "File too large" error
3. [ ] Upload rejected

### No Settings Saved
1. [ ] Clear localStorage (DevTools → Application → Clear)
2. [ ] Call ticket on Ticket Info page
3. [ ] Still announces with default settings
4. [ ] No crashes or errors

---

## Test 5: Multi-Language Support

### English (en)
- [ ] Set language to English
- [ ] Test voice: "Ticket number one"
- [ ] Correct English pronunciation

### Urdu (ur)
- [ ] Set language to Urdu
- [ ] Test voice: "ٹکٹ نمبر ایک"
- [ ] Correct Urdu pronunciation

### Hindi (hi)
- [ ] Set language to Hindi
- [ ] Test voice: "टिकट नंबर एक"
- [ ] Correct Hindi pronunciation

### Other Languages
- [ ] Test Arabic (ar)
- [ ] Test Spanish (es)
- [ ] Test French (fr)
- [ ] All languages work correctly

---

## Test 6: Performance

### Audio Generation Speed
- [ ] Click "Test Voice"
- [ ] Measure time from click to audio start
- [ ] Should be < 3 seconds
- [ ] No long delays

### Page Load Speed
- [ ] Configuration page loads < 2 seconds
- [ ] Ticket Info page loads < 2 seconds
- [ ] No hanging or freezing

### Multiple Announcements
- [ ] Call 5 tickets rapidly (1 per second)
- [ ] Each announcement plays completely
- [ ] No overlapping audio
- [ ] No missed announcements

### Memory Usage
- [ ] Open Task Manager
- [ ] Monitor browser memory
- [ ] Play 20+ announcements
- [ ] Memory stays reasonable (< 500MB growth)
- [ ] No memory leaks

---

## Test 7: Browser Compatibility

### Chrome/Edge
- [ ] All features work
- [ ] Audio plays correctly
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Audio plays correctly
- [ ] No console errors

### Safari (if available)
- [ ] All features work
- [ ] Audio plays correctly
- [ ] No console errors

---

## Common Issues & Solutions

### ❌ Status Shows Offline
**Check:**
1. Python service running on port 5001
2. Backend running on port 5000
3. No firewall blocking connections
4. Check logs for errors

### ❌ No Audio Plays
**Check:**
1. Browser audio not muted
2. System volume > 0
3. Audio URL accessible in browser
4. Network tab shows successful audio request

### ❌ Wrong Voice Used
**Check:**
1. Settings saved in Configuration
2. localStorage has correct settings
3. Ticket Info page loaded AFTER saving
4. Selected voice actually exists

### ❌ Upload Fails
**Check:**
1. File is audio format (WAV, MP3, OGG, M4A)
2. File size < 10MB
3. Backend uploads folder exists
4. Backend has write permissions

---

## Final Verification

### Before Going Live
- [ ] All 7 test sections passed
- [ ] No critical errors in any service logs
- [ ] Settings persist across page refreshes
- [ ] Multiple users can access simultaneously
- [ ] Audio quality acceptable
- [ ] Announcement timing appropriate
- [ ] Documentation reviewed
- [ ] Backup configuration saved

### Success Criteria
✅ Python service: 100% uptime
✅ Backend API: All endpoints working
✅ Configuration page: No errors, settings save
✅ Ticket Info page: Automatic announcements work
✅ Voice quality: Clear and understandable
✅ Performance: < 3 second announcement delay
✅ Cross-browser: Works in Chrome, Edge, Firefox
✅ Multi-language: All configured languages work

---

## 🎉 Testing Complete!

If all checks pass:
- ✅ System is production-ready
- ✅ Voice announcements fully functional
- ✅ Settings persist correctly
- ✅ Error handling works
- ✅ Performance acceptable

**Ready to go live!** 🚀

---

## Continuous Monitoring

After deployment, monitor:
1. **Python service logs** - Check for synthesis errors
2. **Backend logs** - Check for API errors
3. **Browser console** - User-reported issues
4. **Audio playback** - Quality and timing
5. **Settings persistence** - Users not losing config

Set up alerts for:
- Python service downtime
- Backend API failures
- High audio generation latency
- Upload failures

---

## Test Results Template

```
Date: _______________
Tester: _______________

[ ] Test 1: Configuration Page
[ ] Test 2: API Endpoints  
[ ] Test 3: Ticket Info Page
[ ] Test 4: Error Handling
[ ] Test 5: Multi-Language
[ ] Test 6: Performance
[ ] Test 7: Browser Compatibility

Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

Status: [ ] PASS  [ ] FAIL  [ ] NEEDS REVIEW

Notes:
_________________________________________
_________________________________________
_________________________________________
```
