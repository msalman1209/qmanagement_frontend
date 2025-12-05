# Dubai Arabic Multi-Language Configuration Guide

## 🎯 Overview

This guide explains the new multi-language configuration feature with Dubai Arabic support.

## ✨ New Features

### 1. **Multi-Language Selection (Max 2)**
   - Select up to 2 languages for ticket announcements
   - Radio button/checkbox interface for easy selection
   - Automatic replacement when selecting third language

### 2. **Dubai Arabic Support**
   - Added **Dubai Arabic (العربية الإماراتية)** 🇦🇪
   - Proper Arabic numbering and text formatting
   - Right-to-left (RTL) text display

### 3. **Dual Preview Boxes**
   - Two side-by-side preview boxes
   - Auto-translation for selected languages
   - Shows both text and voice settings
   - Real-time preview updates

### 4. **Auto-Translation**
   - Automatic translation based on selected languages
   - Proper formatting for each language
   - RTL support for Arabic and Urdu

## 🌍 Supported Languages

| Language | Code | Flag | RTL Support |
|----------|------|------|-------------|
| English | `en` | 🇬🇧 | No |
| **Dubai Arabic** | `ar-ae` | 🇦🇪 | **Yes** |
| Arabic | `ar` | 🇸🇦 | Yes |
| Urdu | `ur` | 🇵🇰 | Yes |
| Hindi | `hi` | 🇮🇳 | No |
| Spanish | `es` | 🇪🇸 | No |

## 📝 Dubai Arabic Format Example

### English:
```
Ticket number P-101
Please go to counter number 5
```

### Dubai Arabic:
```
تذكرة رقم: مية وواحد
الرجاء الذهاب لكونتر رقم خمسة
```

## 🚀 Setup Instructions

### Step 1: Update Database Schema

Run the migration to add multi-language support:

```bash
cd backend
node database/add-languages-column.js
```

This will:
- Add `languages` column to `voice_settings` table
- Migrate existing language data
- Enable JSON array storage for multiple languages

### Step 2: Access Configuration Page

1. Login to your admin panel
2. Navigate to **Configuration** page
3. Scroll to **Preferred Languages** section

### Step 3: Select Languages

1. **Choose up to 2 languages** by clicking on the checkboxes
2. Languages include:
   - 🇬🇧 English
   - 🇦🇪 **Dubai Arabic** (NEW!)
   - 🇸🇦 Arabic
   - 🇵🇰 Urdu
   - 🇮🇳 Hindi
   - 🇪🇸 Spanish

3. **Selection Rules:**
   - Maximum 2 languages can be selected
   - Click again to deselect
   - If 2 are selected and you click a third, it replaces the first one

### Step 4: Preview Translation

After selecting languages, you'll see **2 preview boxes**:

```
┌─────────────────────┐  ┌─────────────────────┐
│   Box 1: English    │  │  Box 2: Dubai Arabic│
│                     │  │                     │
│  Ticket number      │  │    تذكرة رقم        │
│  P-101              │  │   مية وواحد         │
│  Please go to       │  │   الرجاء الذهاب     │
│  counter 5          │  │    لكونتر رقم خمسة  │
└─────────────────────┘  └─────────────────────┘
```

### Step 5: Configure Voice Settings

1. **Voice Type**: Choose AI voice (Male/Female/Child/Default)
2. **Speech Rate**: Adjust speed (0.5x - 2.0x)
3. **Speech Pitch**: Adjust pitch (0.5 - 2.0)

### Step 6: Test Voice

Click **"🔊 Test AI Voice"** button to:
- Test all selected languages
- Hear announcements in sequence
- Verify pronunciation and timing

### Step 7: Save Settings

Click **"💾 Save Settings"** to:
- Save to database
- Apply to all future announcements
- Backup to browser localStorage

## 🎤 How Announcements Work

When a ticket is called:

1. System reads selected languages from database
2. For each language:
   - Translates ticket text
   - Applies proper formatting (RTL for Arabic)
   - Synthesizes speech with AI voice
   - Plays announcement
3. Announces in sequence with 500ms pause between languages

### Example Flow:
```
1. English: "Ticket number P-101, please go to counter 5"
   [500ms pause]
2. Dubai Arabic: "تذكرة رقم مية وواحد، الرجاء الذهاب لكونتر رقم خمسة"
```

## 🔧 Technical Details

### Database Schema

```sql
-- voice_settings table
CREATE TABLE voice_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  voice_type VARCHAR(50) DEFAULT 'default',
  language VARCHAR(10) DEFAULT 'en',
  languages TEXT NULL COMMENT 'JSON array of selected languages',
  speech_rate DECIMAL(3,2) DEFAULT 0.9,
  speech_pitch DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Translation Mapping

```javascript
// Dubai Arabic numbers
'101' => 'مية وواحد' (miya wa wahid - one hundred and one)
'5'   => 'خمسة' (khamsa - five)

// Dubai Arabic text
'Ticket number' => 'تذكرة رقم'
'Please go to counter number' => 'الرجاء الذهاب لكونتر رقم'
```

## 📱 Frontend Components

### Language Selection Component
- Multi-select checkboxes with radio button behavior
- Visual feedback (green border when selected)
- Disabled state when max reached
- Flag emojis for easy identification

### Preview Boxes Component
- Grid layout (responsive - 1 col on mobile, 2 cols on desktop)
- RTL support for Arabic/Urdu languages
- Auto-translation display
- Voice type indicator

## 🐛 Troubleshooting

### Issue: Languages not saving
**Solution:**
1. Run database migration: `node database/add-languages-column.js`
2. Check backend logs for errors
3. Verify database connection

### Issue: Dubai Arabic not displaying correctly
**Solution:**
1. Ensure browser supports Arabic fonts
2. Check RTL direction is applied
3. Verify UTF-8 encoding

### Issue: Voice test not working
**Solution:**
1. Start Python TTS service: `cd python-tts-service && python app.py`
2. Check service status (should show "Online")
3. Verify network connection to localhost:5001

### Issue: Only one language plays
**Solution:**
1. Check selectedLanguages array in browser console
2. Verify both languages are saved in database
3. Check handleTestVoice function logs

## 🎨 Customization

### Adding More Languages

Edit `page.js` and add to language array:

```javascript
{ code: 'fr', flag: '🇫🇷', name: 'French' }
```

Add translation in `translateText` function:

```javascript
'fr': {
  ticket: 'Numéro de ticket',
  counter: 'Veuillez aller au comptoir numéro',
  number: (num) => num
}
```

### Customizing Dubai Arabic Format

Edit the `ar-ae` translation object:

```javascript
'ar-ae': {
  ticket: 'تذكرة رقم',
  counter: 'الرجاء الذهاب لكونتر رقم',
  number: (num) => {
    // Your custom number formatting
    return convertToArabicWords(num);
  }
}
```

## 📊 Best Practices

1. **Always select at least English** as one language for international users
2. **Test announcements** before going live
3. **Keep speech rate between 0.8-1.2** for clarity
4. **Use default or male/female voices** for best results
5. **Monitor database storage** as JSON adds slight overhead

## 🎯 Use Cases

### Dubai Airport Queue System
```
Languages: English + Dubai Arabic
Use Case: International travelers + local population
```

### Pakistan Government Office
```
Languages: English + Urdu
Use Case: Bilingual announcement for citizens
```

### Saudi Arabia Hospital
```
Languages: Arabic + English
Use Case: Local patients + expatriate doctors
```

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Review backend logs: `cd backend && npm run dev`
3. Verify Python TTS service is running
4. Check database connection and schema

## 🎉 Features Coming Soon

- [ ] Support for 3+ languages
- [ ] Custom voice uploads per language
- [ ] Language-specific voice settings
- [ ] Translation API integration for more accurate translations
- [ ] Audio mixing for simultaneous announcements

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Author:** Tech Solutionor  

**Note:** This feature requires Python TTS service (ChatterBox) to be running for AI voice generation.
