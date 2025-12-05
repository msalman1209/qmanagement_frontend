# 🚀 QUICK REFERENCE CARD - Dubai Arabic Feature

## One-Command Setup
```bash
cd backend && node database/add-languages-column.js
```

## Where to Find It
```
Admin Panel → Configuration → Preferred Languages
```

## How to Use (3 Steps)

### 1️⃣ Select Languages (Max 2)
```
✅ English  ✅ Dubai Arabic  ☐ Others...
```

### 2️⃣ Preview Translation
```
Box 1: English               Box 2: Dubai Arabic
Ticket number P-101          تذكرة رقم: مية وواحد
```

### 3️⃣ Test & Save
```
🔊 Test AI Voice → 💾 Save Settings
```

## Dubai Arabic Examples

| English | Dubai Arabic | Notes |
|---------|--------------|-------|
| Ticket number | تذكرة رقم | |
| P-101 | مية وواحد | One hundred and one |
| Counter | كونتر | Local term |
| Number 5 | رقم خمسة | Five |
| Please go to | الرجاء الذهاب | Polite form |

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Languages not saving | Run: `node database/add-languages-column.js` |
| Arabic not showing | Enable RTL in browser, check UTF-8 encoding |
| Voice not working | Start Python service: `cd python-tts-service && python app.py` |
| Only 1 language plays | Check both languages are selected and saved |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Select language | Click checkbox |
| Deselect | Click again |
| Test voice | Alt+T (after focus) |
| Save | Alt+S (after focus) |

## Configuration Tips

✅ **Best Practices:**
- Always include English for international users
- Keep speech rate between 0.8-1.2 for clarity
- Use Male or Female voice for best results
- Test before going live

❌ **Avoid:**
- Selecting 3 languages (max is 2)
- Extremely fast speech rate (>1.5x)
- Forgetting to save settings
- Skipping voice tests

## File Locations

```
Frontend:  src/app/[role]/configuration/page.js
Backend:   backend/controllers/voice-settings/voiceSettingsController.js
Database:  backend/database/add-languages-column.js
Docs:      DUBAI_ARABIC_MULTI_LANGUAGE_GUIDE.md
```

## API Endpoints

```
GET  /api/voices/settings     → Get saved languages
POST /api/voices/settings     → Save languages
POST /api/voices/synthesize   → Generate speech
GET  /api/voices/health       → Check service status
```

## Database Schema

```sql
voice_settings
  ├── languages TEXT       ← JSON array ["en", "ar-ae"]
  ├── language VARCHAR(10) ← Primary language
  ├── voice_type VARCHAR
  ├── speech_rate DECIMAL
  └── speech_pitch DECIMAL
```

## Languages Supported

| Code | Language | RTL | Flag |
|------|----------|-----|------|
| `en` | English | No | 🇬🇧 |
| `ar-ae` | **Dubai Arabic** | Yes | 🇦🇪 |
| `ar` | Arabic | Yes | 🇸🇦 |
| `ur` | Urdu | Yes | 🇵🇰 |
| `hi` | Hindi | No | 🇮🇳 |
| `es` | Spanish | No | 🇪🇸 |

## Status Indicators

```
🟢 Online  - ChatterBox AI service running
🔴 Offline - Service not available
✅ Saved   - Settings saved to database
⏳ Testing - Voice synthesis in progress
```

## Common Patterns

### Pattern 1: Airport
```
Languages: English + Dubai Arabic
Use Case: International + Local travelers
```

### Pattern 2: Government
```
Languages: English + Urdu (Pakistan)
Languages: English + Arabic (UAE)
Use Case: Citizens + Expats
```

### Pattern 3: Hospital
```
Languages: Arabic + English
Use Case: Local patients + Foreign doctors
```

## Testing Checklist

- [ ] Select 2 languages
- [ ] Preview boxes appear
- [ ] Translations correct
- [ ] RTL text displays properly
- [ ] Voice test works
- [ ] Settings save
- [ ] Page reload persists settings
- [ ] Actual ticket announcements work

## Emergency Commands

```bash
# Reset to defaults
DELETE FROM voice_settings WHERE admin_id = 1;

# Check current settings
SELECT * FROM voice_settings WHERE admin_id = 1;

# Restart services
# Frontend: Ctrl+C then npm run dev
# Backend: Ctrl+C then cd backend && npm run dev
# Python: Ctrl+C then cd python-tts-service && python app.py
```

## Support Resources

📖 Full English Guide: `DUBAI_ARABIC_MULTI_LANGUAGE_GUIDE.md`  
📖 Urdu Guide: `DUBAI_ARABIC_URDU_GUIDE.md`  
📊 Implementation Summary: `IMPLEMENTATION_SUMMARY_DUBAI_ARABIC.md`  
📐 Visual Diagram: `VISUAL_ARCHITECTURE_DIAGRAM.txt`  

## Version Info

**Version:** 1.0.0  
**Date:** December 2025  
**Author:** Tech Solutionor  
**Status:** ✅ Production Ready  

---

## Quick Copy-Paste Commands

```bash
# Complete Setup
cd backend
node database/add-languages-column.js

# Start All Services (Windows)
# Terminal 1
npm run dev

# Terminal 2
cd backend; npm run dev

# Terminal 3
cd python-tts-service; python app.py

# Open in Browser
start http://localhost:3000/admin/configuration
```

```bash
# Complete Setup (Linux/Mac)
cd backend
node database/add-languages-column.js

# Start All Services
npm run dev &
cd backend && npm run dev &
cd python-tts-service && python app.py &

# Open in Browser
open http://localhost:3000/admin/configuration
```

---

**Remember:** Maximum 2 languages, test before saving, start Python service for AI voices! 🎉
