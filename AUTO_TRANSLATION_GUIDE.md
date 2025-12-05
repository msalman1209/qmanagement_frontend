# 🌐 Auto-Translation Feature Guide

## Overview
The system now automatically translates English text into your preferred language before announcing it. You can type in English and the AI will speak it in any language you select!

## How It Works

### 1. **Automatic Translation**
- Type your text in English (or any language)
- Select your preferred language (Urdu, Arabic, Hindi, etc.)
- The system automatically translates the text to that language
- Then speaks it using AI voice in the translated language

### 2. **Example Flow**

**English → Urdu:**
```
You type: "Ticket number 101 please come to counter 5"
System translates to: "ٹکٹ نمبر 101 براہ کرم کاؤنٹر 5 پر آئیں"
AI speaks in Urdu: [Urdu voice announcement]
```

**English → Arabic:**
```
You type: "Ticket number 101 please come to counter 5"
System translates to: "تذكرة رقم 101 يرجى القدوم إلى العداد 5"
AI speaks in Arabic: [Arabic voice announcement]
```

**English → Hindi:**
```
You type: "Ticket number 101 please come to counter 5"
System translates to: "टिकट नंबर 101 कृपया काउंटर 5 पर आएं"
AI speaks in Hindi: [Hindi voice announcement]
```

## Supported Languages

| Language | Code | Example |
|----------|------|---------|
| 🇬🇧 English | `en` | "Please come to counter 5" |
| 🇵🇰 Urdu | `ur` | "براہ کرم کاؤنٹر 5 پر آئیں" |
| 🇸🇦 Arabic | `ar` | "يرجى القدوم إلى العداد 5" |
| 🇮🇳 Hindi | `hi` | "कृपया काउंटर 5 पर आएं" |
| 🇪🇸 Spanish | `es` | "Por favor venga al mostrador 5" |
| 🇫🇷 French | `fr` | "Veuillez venir au comptoir 5" |
| 🇩🇪 German | `de` | "Bitte kommen Sie zu Schalter 5" |
| 🇨🇳 Chinese | `zh` | "请来5号柜台" |
| 🇯🇵 Japanese | `ja` | "カウンター5にお越しください" |

## Configuration Settings

### Set Language in Configuration Page
1. Go to **Configuration Page** (`/admin/configuration`)
2. Select **Preferred Language** dropdown
3. Choose your desired language (e.g., Urdu)
4. Click **Save Settings**
5. Now all announcements will be auto-translated and spoken in that language!

### Test the Translation
1. In Configuration page, enter test text in English
2. Make sure language is set to non-English (e.g., Urdu)
3. Click **Test AI Voice**
4. You'll hear the English text translated and spoken in Urdu!

## Technical Implementation

### Python Service (app.py)
```python
# Auto-translate if language is not English
if language != 'en':
    try:
        logger.info(f"🌐 Auto-translating text to {language}...")
        translated = translator.translate(text, dest=language)
        text = translated.text
        logger.info(f"✅ Translated text: '{text}'")
    except Exception as trans_err:
        logger.warning(f"⚠️ Translation failed, using original text")
```

### Translation Library
- Uses **Google Translate API** via `googletrans==4.0.0rc1`
- Automatic language detection
- Supports 100+ languages
- Fallback to original text if translation fails

## Benefits

### ✅ Multi-Language Support
- Speak announcements in customer's native language
- No need to type in different languages
- Consistent English input for staff

### ✅ Easy to Use
- Type everything in English (familiar for operators)
- System handles translation automatically
- No language barriers for announcements

### ✅ Professional Quality
- Uses Google Translate for accuracy
- Natural voice synthesis in target language
- Proper pronunciation and intonation

## Usage Examples

### Ticket Announcements
```javascript
// In ticket_info page
const text = `Ticket ${ticketNumber} please come to counter ${counterNumber}`;
// Language setting: ur (Urdu)
// Result: "ٹکٹ 101 براہ کرم کاؤنٹر 5 پر آئیں"
```

### Service Announcements
```javascript
// English input
const text = "Please wait, we will call you shortly";
// Language: ar (Arabic)
// Result: "يرجى الانتظار، سنتصل بك قريباً"
```

### Custom Messages
```javascript
// English input
const text = "Counter 3 is now available";
// Language: hi (Hindi)
// Result: "काउंटर 3 अब उपलब्ध है"
```

## Troubleshooting

### Translation Not Working?
1. **Check Python Service**: Make sure Python TTS service is running
2. **Check Internet**: Google Translate requires internet connection
3. **Check Logs**: Look in Python terminal for translation errors
4. **Fallback**: If translation fails, original text will be used

### Language Not Supported?
- The system supports 100+ languages via Google Translate
- If a language code is not recognized, it defaults to English
- Check the supported language codes in the table above

### Translation Inaccurate?
- Google Translate is generally accurate for common phrases
- For technical terms, you may need to adjust the English input
- Consider using simpler, clearer English for better translations

## Installation

### Required Package
```bash
cd python-tts-service
pip install googletrans==4.0.0rc1
```

### Restart Service
```bash
cd python-tts-service
python app.py
```

## Logs and Debugging

### Python Service Logs
```
🌐 Auto-translating text to ur...
Original text: 'Ticket number 101 please come to counter 5'
✅ Translated text: 'ٹکٹ نمبر 101 براہ کرم کاؤنٹر 5 پر آئیں'
Using gTTS with language code: ur (from input: ur)
Speech generated successfully
```

### Frontend Console Logs
```javascript
console.log('Sending text:', text);
console.log('Target language:', language);
console.log('Audio URL:', response.data.audioUrl);
```

## Database Integration

Settings are stored in `voice_settings` table:
- `voice_type`: Voice selection (male/female/child)
- `language`: Target language code (en/ur/ar/hi/etc.)
- `speech_rate`: Speed of speech
- `speech_pitch`: Pitch of voice

All settings are automatically applied to announcements with translation!

## Summary

🎯 **Type in English → System Translates → AI Speaks in Target Language**

This makes your queue management system truly multi-lingual and accessible to all customers, regardless of their language preference!
