# 🐛 Voice Test Debugging Guide

## Issue: Dosri voice test nahi ho rahi

### Possible Causes & Solutions

#### 1. **selectedLanguages State Check**

Browser console mein ye command chalayein:
```javascript
// Check current state
console.log('Selected Languages:', window.localStorage.getItem('tts_settings'));
```

#### 2. **Direct Test from Console**

Configuration page par jakar, browser console mein ye commands run karein:

```javascript
// Test 1: Check if languages are selected
console.log('Testing languages...');

// Test 2: Manual test for both languages
async function testBothLanguages() {
  const languages = ['en', 'ar-ae'];
  
  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const text = lang === 'en' 
      ? 'Ticket number P-101 please come to counter 5'
      : 'التذكره رقم بي -١٠١ الذهاب إلى الكونتر رقم ٥';
    
    console.log(`\n📢 Testing Box ${i + 1}: ${lang}`);
    console.log(`Text: ${text}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/voices/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: lang,
          rate: 0.9,
          pitch: 1.0,
          voiceType: 'male'
        })
      });
      
      const data = await response.json();
      console.log(`✅ Box ${i + 1} response:`, data);
      
      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.volume = 1.0;
        
        await new Promise((resolve) => {
          audio.onplay = () => console.log(`▶️ Box ${i + 1} playing...`);
          audio.onended = () => {
            console.log(`✅ Box ${i + 1} completed!`);
            resolve();
          };
          audio.onerror = (e) => {
            console.error(`❌ Box ${i + 1} error:`, e);
            resolve();
          };
          audio.play();
        });
        
        // Pause between languages
        if (i < languages.length - 1) {
          console.log('⏸️ Pausing 200ms...');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error(`❌ Box ${i + 1} failed:`, error);
    }
  }
  
  console.log('🎉 Test complete!');
}

// Run the test
testBothLanguages();
```

### 3. **Check Python Service**

Terminal mein Python service ke logs check karein:
```bash
# Python service running hai ya nahi
curl http://localhost:5001/health

# Ya
Invoke-WebRequest -Uri http://localhost:5001/health
```

### 4. **Network Tab Check**

1. Browser Developer Tools kholen (F12)
2. **Network** tab par jayen
3. "🔊 Test AI Voice" button click karen
4. Dekhen:
   - Kitne requests bhi rahe hain?
   - Dono languages ke liye separate requests hain?
   - Response kya aa raha hai?

### 5. **Common Issues & Fixes**

#### Issue: Sirf pehli language play ho rahi hai
**Fix:**
```javascript
// Check if loop is working
console.log('Selected languages:', selectedLanguages);
console.log('Length:', selectedLanguages.length);
```

#### Issue: Second audio file generate nahi ho rahi
**Solution:** Python service restart karen:
```bash
cd python-tts-service
# Stop current service (Ctrl+C)
python app.py
```

#### Issue: Browser console mein error aa raha hai
**Check:**
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');
location.reload();
```

### 6. **Step-by-Step Debug Process**

1. **Configuration Page kholen**
   ```
   http://localhost:3000/admin/configuration
   ```

2. **2 Languages Select karen**
   - ✅ English
   - ✅ Dubai Arabic

3. **Browser Console kholen (F12)**

4. **Test Voice Click karen**

5. **Console output dekhen:**
   ```
   Should see:
   🎯 Starting voice test with: {...}
   📢 Testing Box 1/2: en
   ✅ Box 1 synthesis response: {...}
   🔊 Box 1 - Playing audio from: ...
   ▶️ Box 1 (en) - Playback started
   ✅ Box 1 (en) - Playback completed
   ⏸️ Pausing 200ms before Box 2...
   📢 Testing Box 2/2: ar-ae
   ✅ Box 2 synthesis response: {...}
   🔊 Box 2 - Playing audio from: ...
   ▶️ Box 2 (ar-ae) - Playback started
   ✅ Box 2 (ar-ae) - Playback completed
   🎉 All voice tests completed successfully!
   ```

### 7. **Expected Flow Diagram**

```
User clicks "Test Voice"
    ↓
Check if service online ✅
    ↓
Loop through selectedLanguages [0, 1]
    ↓
    ├── i=0 (Box 1 - English)
    │   ├── Translate text ✅
    │   ├── POST to /api/voices/synthesize ✅
    │   ├── Get audioUrl ✅
    │   ├── Create Audio object ✅
    │   ├── Play audio ✅
    │   ├── Wait for onended ✅
    │   └── 200ms pause ✅
    │
    └── i=1 (Box 2 - Dubai Arabic)
        ├── Translate text ✅
        ├── POST to /api/voices/synthesize ✅
        ├── Get audioUrl ✅
        ├── Create Audio object ✅
        ├── Play audio ✅
        └── Wait for onended ✅
    ↓
Show success alert ✅
```

### 8. **Quick Fixes**

#### Fix 1: Clear cache and reload
```javascript
localStorage.clear();
location.reload();
```

#### Fix 2: Reset to defaults
```javascript
localStorage.setItem('tts_settings', JSON.stringify({
  selectedLanguages: ['en', 'ar-ae'],
  speechRate: 0.9,
  speechPitch: 1.0,
  selectedChatterboxVoice: 'male',
  useAI: true
}));
location.reload();
```

#### Fix 3: Force test with hardcoded values
```javascript
// Directly in console
async function forceTest() {
  const langs = ['en', 'ar-ae'];
  for (const lang of langs) {
    const text = lang === 'en' 
      ? 'Test English'
      : 'التذكره رقم بي -١٠١';
    
    const res = await fetch('http://localhost:5000/api/voices/synthesize', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text, language: lang, voiceType: 'male'})
    });
    
    const data = await res.json();
    console.log(lang, ':', data);
    
    if (data.audioUrl) {
      const audio = new Audio(data.audioUrl);
      await new Promise(r => {
        audio.onended = r;
        audio.play();
      });
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

forceTest();
```

### 9. **Verify Settings Saved**

```bash
# Backend terminal
cd backend
node -e "
const pool = require('./config/database.js');
(async () => {
  const [rows] = await pool.query('SELECT * FROM voice_settings WHERE admin_id = 1');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
})();
"
```

### 10. **Test Python Service Directly**

```bash
# Test English
curl -X POST http://localhost:5001/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Test English","language":"en","voice_type":"male"}'

# Test Dubai Arabic
curl -X POST http://localhost:5001/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"التذكره رقم بي","language":"ar-ae","voice_type":"male"}'
```

**PowerShell version:**
```powershell
# Test English
Invoke-RestMethod -Uri http://localhost:5001/api/tts/synthesize `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"text":"Test English","language":"en","voice_type":"male"}'

# Test Dubai Arabic
Invoke-RestMethod -Uri http://localhost:5001/api/tts/synthesize `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"text":"التذكره رقم بي","language":"ar-ae","voice_type":"male"}'
```

---

## Summary

Agar dosri voice test nahi ho rahi to:

1. ✅ Browser console check karen - errors dekhen
2. ✅ Network tab check karen - requests dekhen
3. ✅ Python service logs dekhen
4. ✅ selectedLanguages state verify karen
5. ✅ Direct console test chalayein

**Most Common Issue:** Audio playback ke beech mein promise resolve nahi ho raha, jis se second language tak loop nahi pohunchta.

**Solution:** Updated code mein ab proper error handling aur logging hai. Browser console output clearly dikhayega kahan issue hai.
